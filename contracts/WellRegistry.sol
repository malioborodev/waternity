// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WellRegistry
 * @dev NFT contract untuk registrasi dan kepemilikan sumur air
 * Setiap NFT merepresentasikan satu sumur dengan metadata dan revenue sharing
 */
contract WellRegistry is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    struct WellInfo {
        string name;
        string location;
        address operator;
        uint256 totalShares;
        uint256 availableShares;
        uint256 pricePerLiter;
        bool isActive;
        uint256 createdAt;
        string metadataURI;
    }
    
    // Mapping dari token ID ke informasi sumur
    mapping(uint256 => WellInfo) public wells;
    
    // Mapping operator ke daftar sumur yang dikelola
    mapping(address => uint256[]) public operatorWells;
    
    // Events
    event WellRegistered(
        uint256 indexed tokenId,
        string name,
        string location,
        address indexed operator,
        uint256 totalShares
    );
    
    event WellStatusUpdated(uint256 indexed tokenId, bool isActive);
    event OperatorChanged(uint256 indexed tokenId, address indexed oldOperator, address indexed newOperator);
    event SharesUpdated(uint256 indexed tokenId, uint256 availableShares);
    
    constructor() ERC721("Waternity Well NFT", "WELL") {}
    
    /**
     * @dev Registrasi sumur baru dan mint NFT
     * @param _name Nama sumur
     * @param _location Lokasi sumur
     * @param _operator Address operator yang mengelola sumur
     * @param _totalShares Total shares yang tersedia untuk investasi
     * @param _pricePerLiter Harga per liter air (dalam wei)
     * @param _metadataURI URI untuk metadata NFT
     */
    function registerWell(
        string memory _name,
        string memory _location,
        address _operator,
        uint256 _totalShares,
        uint256 _pricePerLiter,
        string memory _metadataURI
    ) external onlyOwner returns (uint256) {
        require(_operator != address(0), "Invalid operator address");
        require(_totalShares > 0, "Total shares must be greater than 0");
        require(_pricePerLiter > 0, "Price per liter must be greater than 0");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint NFT ke contract owner
        _mint(msg.sender, newTokenId);
        
        // Simpan informasi sumur
        wells[newTokenId] = WellInfo({
            name: _name,
            location: _location,
            operator: _operator,
            totalShares: _totalShares,
            availableShares: _totalShares,
            pricePerLiter: _pricePerLiter,
            isActive: true,
            createdAt: block.timestamp,
            metadataURI: _metadataURI
        });
        
        // Tambahkan ke daftar sumur operator
        operatorWells[_operator].push(newTokenId);
        
        emit WellRegistered(newTokenId, _name, _location, _operator, _totalShares);
        
        return newTokenId;
    }
    
    /**
     * @dev Update status aktif sumur
     * @param _tokenId ID token sumur
     * @param _isActive Status aktif baru
     */
    function updateWellStatus(uint256 _tokenId, bool _isActive) external {
        require(_exists(_tokenId), "Well does not exist");
        require(
            msg.sender == owner() || msg.sender == wells[_tokenId].operator,
            "Not authorized"
        );
        
        wells[_tokenId].isActive = _isActive;
        emit WellStatusUpdated(_tokenId, _isActive);
    }
    
    /**
     * @dev Ganti operator sumur
     * @param _tokenId ID token sumur
     * @param _newOperator Address operator baru
     */
    function changeOperator(uint256 _tokenId, address _newOperator) external onlyOwner {
        require(_exists(_tokenId), "Well does not exist");
        require(_newOperator != address(0), "Invalid operator address");
        
        address oldOperator = wells[_tokenId].operator;
        wells[_tokenId].operator = _newOperator;
        
        // Update mapping operator wells
        _removeWellFromOperator(oldOperator, _tokenId);
        operatorWells[_newOperator].push(_tokenId);
        
        emit OperatorChanged(_tokenId, oldOperator, _newOperator);
    }
    
    /**
     * @dev Update available shares (dipanggil oleh FractionalVault)
     * @param _tokenId ID token sumur
     * @param _availableShares Jumlah shares yang tersedia
     */
    function updateAvailableShares(uint256 _tokenId, uint256 _availableShares) external {
        require(_exists(_tokenId), "Well does not exist");
        require(_availableShares <= wells[_tokenId].totalShares, "Exceeds total shares");
        
        // Hanya FractionalVault yang bisa update shares
        // TODO: Implement proper access control
        
        wells[_tokenId].availableShares = _availableShares;
        emit SharesUpdated(_tokenId, _availableShares);
    }
    
    /**
     * @dev Get informasi lengkap sumur
     * @param _tokenId ID token sumur
     */
    function getWellInfo(uint256 _tokenId) external view returns (WellInfo memory) {
        require(_exists(_tokenId), "Well does not exist");
        return wells[_tokenId];
    }
    
    /**
     * @dev Get daftar sumur yang dikelola operator
     * @param _operator Address operator
     */
    function getOperatorWells(address _operator) external view returns (uint256[] memory) {
        return operatorWells[_operator];
    }
    
    /**
     * @dev Get total jumlah sumur yang terdaftar
     */
    function getTotalWells() external view returns (uint256) {
        return _tokenIds.current();
    }
    
    /**
     * @dev Override tokenURI untuk menggunakan metadata URI dari well info
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Well does not exist");
        return wells[tokenId].metadataURI;
    }
    
    /**
     * @dev Helper function untuk menghapus well dari operator mapping
     */
    function _removeWellFromOperator(address _operator, uint256 _tokenId) private {
        uint256[] storage wells = operatorWells[_operator];
        for (uint256 i = 0; i < wells.length; i++) {
            if (wells[i] == _tokenId) {
                wells[i] = wells[wells.length - 1];
                wells.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Override untuk mencegah transfer NFT (sumur tidak bisa dipindahtangankan)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        require(from == address(0) || to == address(0), "Well NFTs are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}