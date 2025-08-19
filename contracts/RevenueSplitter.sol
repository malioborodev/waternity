// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./WellRegistry.sol";

/**
 * @title RevenueSplitter
 * @dev Contract untuk membagi revenue dari penjualan air antara operator dan investor
 * Menggunakan fractional ownership dari well NFTs
 */
contract RevenueSplitter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Reference ke contracts lain
    WellRegistry public immutable wellRegistry;
    IERC20 public immutable stablecoin;
    
    // Revenue split percentages (basis points, 10000 = 100%)
    uint256 public constant OPERATOR_SHARE = 3000; // 30%
    uint256 public constant INVESTOR_SHARE = 7000; // 70%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Mapping untuk tracking revenue per well
    mapping(uint256 => uint256) public wellTotalRevenue;
    mapping(uint256 => uint256) public wellDistributedRevenue;
    
    // Mapping untuk tracking claimed amounts per investor per well
    mapping(uint256 => mapping(address => uint256)) public investorClaimedAmount;
    
    // Mapping untuk tracking operator claimed amounts per well
    mapping(uint256 => uint256) public operatorClaimedAmount;
    
    // Mapping untuk fractional shares per well
    mapping(uint256 => mapping(address => uint256)) public fractionalShares;
    mapping(uint256 => uint256) public totalFractionalShares;
    
    // Events
    event RevenueAdded(uint256 indexed wellId, uint256 amount);
    event OperatorClaimed(uint256 indexed wellId, address indexed operator, uint256 amount);
    event InvestorClaimed(uint256 indexed wellId, address indexed investor, uint256 amount);
    event SharesIssued(uint256 indexed wellId, address indexed investor, uint256 shares);
    event SharesTransferred(uint256 indexed wellId, address indexed from, address indexed to, uint256 shares);
    
    // Errors
    error InvalidWellId();
    error NotWellOperator();
    error NoClaimableRevenue();
    error InsufficientShares();
    error InvalidShareAmount();
    
    constructor(address _wellRegistry, address _stablecoin) {
        require(_wellRegistry != address(0), "Invalid well registry address");
        require(_stablecoin != address(0), "Invalid stablecoin address");
        
        wellRegistry = WellRegistry(_wellRegistry);
        stablecoin = IERC20(_stablecoin);
    }
    
    /**
     * @dev Add revenue untuk well tertentu (dipanggil oleh DepositManager)
     * @param _wellId ID sumur
     * @param _amount Jumlah revenue yang ditambahkan
     */
    function addRevenue(uint256 _wellId, uint256 _amount) external {
        // TODO: Implement proper access control untuk DepositManager
        require(_amount > 0, "Amount must be greater than 0");
        require(wellRegistry.exists(_wellId), "Well does not exist");
        
        wellTotalRevenue[_wellId] += _amount;
        
        emit RevenueAdded(_wellId, _amount);
    }
    
    /**
     * @dev Issue fractional shares untuk investor
     * @param _wellId ID sumur
     * @param _investor Address investor
     * @param _shares Jumlah shares yang di-issue
     */
    function issueShares(
        uint256 _wellId,
        address _investor,
        uint256 _shares
    ) external {
        require(wellRegistry.exists(_wellId), "Well does not exist");
        require(_investor != address(0), "Invalid investor address");
        require(_shares > 0, "Shares must be greater than 0");
        
        // Only well operator atau owner yang bisa issue shares
        address wellOperator = wellRegistry.getWellOperator(_wellId);
        require(
            msg.sender == wellOperator || msg.sender == owner(),
            "Not authorized to issue shares"
        );
        
        fractionalShares[_wellId][_investor] += _shares;
        totalFractionalShares[_wellId] += _shares;
        
        emit SharesIssued(_wellId, _investor, _shares);
    }
    
    /**
     * @dev Transfer fractional shares antar investor
     * @param _wellId ID sumur
     * @param _to Address penerima
     * @param _shares Jumlah shares yang ditransfer
     */
    function transferShares(
        uint256 _wellId,
        address _to,
        uint256 _shares
    ) external {
        require(wellRegistry.exists(_wellId), "Well does not exist");
        require(_to != address(0), "Invalid recipient address");
        require(_shares > 0, "Shares must be greater than 0");
        require(fractionalShares[_wellId][msg.sender] >= _shares, "Insufficient shares");
        
        fractionalShares[_wellId][msg.sender] -= _shares;
        fractionalShares[_wellId][_to] += _shares;
        
        emit SharesTransferred(_wellId, msg.sender, _to, _shares);
    }
    
    /**
     * @dev Claim revenue untuk operator
     * @param _wellId ID sumur
     */
    function claimOperatorRevenue(uint256 _wellId) external nonReentrant {
        require(wellRegistry.exists(_wellId), "Well does not exist");
        
        address wellOperator = wellRegistry.getWellOperator(_wellId);
        require(msg.sender == wellOperator, "Not well operator");
        
        uint256 claimableAmount = getOperatorClaimableAmount(_wellId);
        if (claimableAmount == 0) revert NoClaimableRevenue();
        
        operatorClaimedAmount[_wellId] += claimableAmount;
        
        // Transfer stablecoin ke operator
        stablecoin.safeTransfer(wellOperator, claimableAmount);
        
        emit OperatorClaimed(_wellId, wellOperator, claimableAmount);
    }
    
    /**
     * @dev Claim revenue untuk investor berdasarkan fractional shares
     * @param _wellId ID sumur
     */
    function claimInvestorRevenue(uint256 _wellId) external nonReentrant {
        require(wellRegistry.exists(_wellId), "Well does not exist");
        require(fractionalShares[_wellId][msg.sender] > 0, "No shares owned");
        
        uint256 claimableAmount = getInvestorClaimableAmount(_wellId, msg.sender);
        if (claimableAmount == 0) revert NoClaimableRevenue();
        
        investorClaimedAmount[_wellId][msg.sender] += claimableAmount;
        
        // Transfer stablecoin ke investor
        stablecoin.safeTransfer(msg.sender, claimableAmount);
        
        emit InvestorClaimed(_wellId, msg.sender, claimableAmount);
    }
    
    /**
     * @dev Get claimable amount untuk operator
     * @param _wellId ID sumur
     */
    function getOperatorClaimableAmount(uint256 _wellId) public view returns (uint256) {
        uint256 totalRevenue = wellTotalRevenue[_wellId];
        uint256 operatorTotalShare = (totalRevenue * OPERATOR_SHARE) / BASIS_POINTS;
        uint256 alreadyClaimed = operatorClaimedAmount[_wellId];
        
        return operatorTotalShare > alreadyClaimed ? operatorTotalShare - alreadyClaimed : 0;
    }
    
    /**
     * @dev Get claimable amount untuk investor
     * @param _wellId ID sumur
     * @param _investor Address investor
     */
    function getInvestorClaimableAmount(uint256 _wellId, address _investor) 
        public 
        view 
        returns (uint256) 
    {
        uint256 totalRevenue = wellTotalRevenue[_wellId];
        uint256 investorTotalPool = (totalRevenue * INVESTOR_SHARE) / BASIS_POINTS;
        
        uint256 investorShares = fractionalShares[_wellId][_investor];
        uint256 totalShares = totalFractionalShares[_wellId];
        
        if (totalShares == 0) return 0;
        
        uint256 investorTotalShare = (investorTotalPool * investorShares) / totalShares;
        uint256 alreadyClaimed = investorClaimedAmount[_wellId][_investor];
        
        return investorTotalShare > alreadyClaimed ? investorTotalShare - alreadyClaimed : 0;
    }
    
    /**
     * @dev Get investor shares untuk well tertentu
     * @param _wellId ID sumur
     * @param _investor Address investor
     */
    function getInvestorShares(uint256 _wellId, address _investor) 
        external 
        view 
        returns (uint256) 
    {
        return fractionalShares[_wellId][_investor];
    }
    
    /**
     * @dev Get total shares untuk well tertentu
     * @param _wellId ID sumur
     */
    function getTotalShares(uint256 _wellId) external view returns (uint256) {
        return totalFractionalShares[_wellId];
    }
    
    /**
     * @dev Get ownership percentage untuk investor
     * @param _wellId ID sumur
     * @param _investor Address investor
     */
    function getOwnershipPercentage(uint256 _wellId, address _investor) 
        external 
        view 
        returns (uint256) 
    {
        uint256 totalShares = totalFractionalShares[_wellId];
        if (totalShares == 0) return 0;
        
        uint256 investorShares = fractionalShares[_wellId][_investor];
        return (investorShares * BASIS_POINTS) / totalShares; // Returns in basis points
    }
    
    /**
     * @dev Get well revenue statistics
     * @param _wellId ID sumur
     */
    function getWellRevenueStats(uint256 _wellId) 
        external 
        view 
        returns (
            uint256 totalRevenue,
            uint256 operatorShare,
            uint256 investorShare,
            uint256 operatorClaimed,
            uint256 totalShares
        ) 
    {
        totalRevenue = wellTotalRevenue[_wellId];
        operatorShare = (totalRevenue * OPERATOR_SHARE) / BASIS_POINTS;
        investorShare = (totalRevenue * INVESTOR_SHARE) / BASIS_POINTS;
        operatorClaimed = operatorClaimedAmount[_wellId];
        totalShares = totalFractionalShares[_wellId];
    }
    
    /**
     * @dev Batch claim untuk multiple wells (investor)
     * @param _wellIds Array ID sumur
     */
    function batchClaimInvestorRevenue(uint256[] calldata _wellIds) external nonReentrant {
        for (uint256 i = 0; i < _wellIds.length; i++) {
            uint256 wellId = _wellIds[i];
            
            if (!wellRegistry.exists(wellId)) continue;
            if (fractionalShares[wellId][msg.sender] == 0) continue;
            
            uint256 claimableAmount = getInvestorClaimableAmount(wellId, msg.sender);
            if (claimableAmount == 0) continue;
            
            investorClaimedAmount[wellId][msg.sender] += claimableAmount;
            stablecoin.safeTransfer(msg.sender, claimableAmount);
            
            emit InvestorClaimed(wellId, msg.sender, claimableAmount);
        }
    }
    
    /**
     * @dev Emergency function untuk withdraw stablecoin (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = stablecoin.balanceOf(address(this));
        stablecoin.safeTransfer(owner(), balance);
    }
}