// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DepositManager
 * @dev Contract untuk mengelola deposit pengguna menggunakan HTS stablecoin
 * Menangani top-up balance, pembayaran air, dan integrasi dengan IoT devices
 */
contract DepositManager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // HTS Stablecoin token (USDC/USDT equivalent)
    IERC20 public immutable stablecoin;
    
    // Mapping user address ke balance
    mapping(address => uint256) public userBalances;
    
    // Mapping untuk session aktif (user => sessionId => sessionData)
    mapping(address => mapping(bytes32 => SessionData)) public activeSessions;
    
    // Mapping untuk tracking total volume per well
    mapping(uint256 => uint256) public wellTotalVolume;
    
    // Mapping untuk tracking revenue per well
    mapping(uint256 => uint256) public wellTotalRevenue;
    
    struct SessionData {
        uint256 wellId;
        uint256 maxVolume; // Maximum volume yang bisa diambil
        uint256 usedVolume; // Volume yang sudah digunakan
        uint256 pricePerLiter;
        uint256 startTime;
        uint256 expiryTime;
        bool isActive;
    }
    
    // Events
    event BalanceTopUp(address indexed user, uint256 amount);
    event SessionCreated(
        address indexed user,
        bytes32 indexed sessionId,
        uint256 indexed wellId,
        uint256 maxVolume,
        uint256 pricePerLiter
    );
    event WaterDispensed(
        address indexed user,
        bytes32 indexed sessionId,
        uint256 indexed wellId,
        uint256 volume,
        uint256 cost
    );
    event SessionClosed(address indexed user, bytes32 indexed sessionId);
    event BalanceWithdrawn(address indexed user, uint256 amount);
    
    // Errors
    error InsufficientBalance();
    error InvalidSession();
    error SessionExpired();
    error ExceedsMaxVolume();
    error InvalidWellId();
    error SessionNotActive();
    
    constructor(address _stablecoin) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        stablecoin = IERC20(_stablecoin);
    }
    
    /**
     * @dev Top up user balance dengan stablecoin
     * @param _amount Jumlah stablecoin yang akan di-deposit
     */
    function topUpBalance(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transfer stablecoin dari user ke contract
        stablecoin.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user balance
        userBalances[msg.sender] += _amount;
        
        emit BalanceTopUp(msg.sender, _amount);
    }
    
    /**
     * @dev Withdraw balance kembali ke stablecoin
     * @param _amount Jumlah yang akan di-withdraw
     */
    function withdrawBalance(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(userBalances[msg.sender] >= _amount, "Insufficient balance");
        
        // Update balance
        userBalances[msg.sender] -= _amount;
        
        // Transfer stablecoin kembali ke user
        stablecoin.safeTransfer(msg.sender, _amount);
        
        emit BalanceWithdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev Buat session baru untuk akses air (dipanggil saat QR scan)
     * @param _wellId ID sumur yang akan diakses
     * @param _maxVolume Volume maksimum yang bisa diambil (dalam mililiter)
     * @param _pricePerLiter Harga per liter (dalam wei stablecoin)
     * @param _sessionDuration Durasi session dalam detik
     */
    function createSession(
        uint256 _wellId,
        uint256 _maxVolume,
        uint256 _pricePerLiter,
        uint256 _sessionDuration
    ) external nonReentrant returns (bytes32) {
        require(_wellId > 0, "Invalid well ID");
        require(_maxVolume > 0, "Max volume must be greater than 0");
        require(_pricePerLiter > 0, "Price per liter must be greater than 0");
        require(_sessionDuration > 0 && _sessionDuration <= 3600, "Invalid session duration"); // Max 1 hour
        
        // Hitung total cost untuk max volume
        uint256 totalCost = (_maxVolume * _pricePerLiter) / 1000; // Convert mL to L
        
        // Check user balance
        if (userBalances[msg.sender] < totalCost) {
            revert InsufficientBalance();
        }
        
        // Generate session ID
        bytes32 sessionId = keccak256(
            abi.encodePacked(
                msg.sender,
                _wellId,
                block.timestamp,
                block.difficulty
            )
        );
        
        // Create session
        activeSessions[msg.sender][sessionId] = SessionData({
            wellId: _wellId,
            maxVolume: _maxVolume,
            usedVolume: 0,
            pricePerLiter: _pricePerLiter,
            startTime: block.timestamp,
            expiryTime: block.timestamp + _sessionDuration,
            isActive: true
        });
        
        emit SessionCreated(msg.sender, sessionId, _wellId, _maxVolume, _pricePerLiter);
        
        return sessionId;
    }
    
    /**
     * @dev Dispense air (dipanggil oleh IoT device atau oracle)
     * @param _user Address pengguna
     * @param _sessionId ID session
     * @param _volume Volume air yang di-dispense (dalam mililiter)
     */
    function dispenseWater(
        address _user,
        bytes32 _sessionId,
        uint256 _volume
    ) external nonReentrant {
        // TODO: Implement proper access control untuk IoT devices/oracles
        
        SessionData storage session = activeSessions[_user][_sessionId];
        
        // Validasi session
        if (!session.isActive) revert SessionNotActive();
        if (block.timestamp > session.expiryTime) revert SessionExpired();
        if (session.usedVolume + _volume > session.maxVolume) revert ExceedsMaxVolume();
        
        // Hitung cost
        uint256 cost = (_volume * session.pricePerLiter) / 1000; // Convert mL to L
        
        // Check balance
        if (userBalances[_user] < cost) revert InsufficientBalance();
        
        // Update session dan balance
        session.usedVolume += _volume;
        userBalances[_user] -= cost;
        
        // Update well statistics
        wellTotalVolume[session.wellId] += _volume;
        wellTotalRevenue[session.wellId] += cost;
        
        emit WaterDispensed(_user, _sessionId, session.wellId, _volume, cost);
        
        // Auto-close session jika sudah mencapai max volume
        if (session.usedVolume >= session.maxVolume) {
            session.isActive = false;
            emit SessionClosed(_user, _sessionId);
        }
    }
    
    /**
     * @dev Close session secara manual
     * @param _sessionId ID session yang akan ditutup
     */
    function closeSession(bytes32 _sessionId) external {
        SessionData storage session = activeSessions[msg.sender][_sessionId];
        require(session.isActive, "Session not active");
        
        session.isActive = false;
        emit SessionClosed(msg.sender, _sessionId);
    }
    
    /**
     * @dev Get session data
     * @param _user Address pengguna
     * @param _sessionId ID session
     */
    function getSession(address _user, bytes32 _sessionId) 
        external 
        view 
        returns (SessionData memory) 
    {
        return activeSessions[_user][_sessionId];
    }
    
    /**
     * @dev Get user balance
     * @param _user Address pengguna
     */
    function getUserBalance(address _user) external view returns (uint256) {
        return userBalances[_user];
    }
    
    /**
     * @dev Get well statistics
     * @param _wellId ID sumur
     */
    function getWellStats(uint256 _wellId) 
        external 
        view 
        returns (uint256 totalVolume, uint256 totalRevenue) 
    {
        return (wellTotalVolume[_wellId], wellTotalRevenue[_wellId]);
    }
    
    /**
     * @dev Check if session is valid and active
     * @param _user Address pengguna
     * @param _sessionId ID session
     */
    function isSessionValid(address _user, bytes32 _sessionId) 
        external 
        view 
        returns (bool) 
    {
        SessionData memory session = activeSessions[_user][_sessionId];
        return session.isActive && block.timestamp <= session.expiryTime;
    }
    
    /**
     * @dev Emergency function untuk withdraw semua stablecoin (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = stablecoin.balanceOf(address(this));
        stablecoin.safeTransfer(owner(), balance);
    }
}