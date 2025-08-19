// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./WellRegistry.sol";
import "./RevenueSplitter.sol";

/**
 * @title FractionalVault
 * @dev Contract untuk mengelola fractional ownership dan marketplace untuk well shares
 * Memungkinkan investor untuk membeli, menjual, dan trade fractional shares dari wells
 */
contract FractionalVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    
    // Reference ke contracts lain
    WellRegistry public immutable wellRegistry;
    RevenueSplitter public immutable revenueSplitter;
    IERC20 public immutable stablecoin;
    
    // Marketplace fee (basis points)
    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_FEE = 1000; // 10% max fee
    
    // Listing structure
    struct Listing {
        uint256 wellId;
        address seller;
        uint256 shares;
        uint256 pricePerShare;
        uint256 totalPrice;
        uint256 expiryTime;
        bool isActive;
        uint256 listingId;
    }
    
    // Offer structure
    struct Offer {
        uint256 wellId;
        address buyer;
        uint256 shares;
        uint256 pricePerShare;
        uint256 totalPrice;
        uint256 expiryTime;
        bool isActive;
        uint256 offerId;
    }
    
    // Storage
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    mapping(uint256 => uint256[]) public wellListings; // wellId => listingIds
    mapping(uint256 => uint256[]) public wellOffers; // wellId => offerIds
    
    uint256 public nextListingId = 1;
    uint256 public nextOfferId = 1;
    
    // Well valuation data
    mapping(uint256 => uint256) public wellValuation; // Manual valuation per well
    mapping(uint256 => uint256) public wellLastSalePrice; // Last sale price per share
    
    // Events
    event SharesListed(
        uint256 indexed listingId,
        uint256 indexed wellId,
        address indexed seller,
        uint256 shares,
        uint256 pricePerShare
    );
    event SharesSold(
        uint256 indexed listingId,
        uint256 indexed wellId,
        address indexed seller,
        address buyer,
        uint256 shares,
        uint256 totalPrice
    );
    event ListingCancelled(uint256 indexed listingId);
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed wellId,
        address indexed buyer,
        uint256 shares,
        uint256 pricePerShare
    );
    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed wellId,
        address indexed seller,
        address buyer,
        uint256 shares,
        uint256 totalPrice
    );
    event OfferCancelled(uint256 indexed offerId);
    event WellValuationUpdated(uint256 indexed wellId, uint256 newValuation);
    
    // Errors
    error InvalidWellId();
    error InsufficientShares();
    error InvalidPrice();
    error ListingNotActive();
    error OfferNotActive();
    error NotListingOwner();
    error NotOfferOwner();
    error InsufficientBalance();
    error InvalidDuration();
    
    constructor(
        address _wellRegistry,
        address _revenueSplitter,
        address _stablecoin
    ) {
        require(_wellRegistry != address(0), "Invalid well registry address");
        require(_revenueSplitter != address(0), "Invalid revenue splitter address");
        require(_stablecoin != address(0), "Invalid stablecoin address");
        
        wellRegistry = WellRegistry(_wellRegistry);
        revenueSplitter = RevenueSplitter(_revenueSplitter);
        stablecoin = IERC20(_stablecoin);
    }
    
    /**
     * @dev List shares untuk dijual di marketplace
     * @param _wellId ID sumur
     * @param _shares Jumlah shares yang akan dijual
     * @param _pricePerShare Harga per share dalam stablecoin
     * @param _duration Durasi listing dalam detik
     */
    function listShares(
        uint256 _wellId,
        uint256 _shares,
        uint256 _pricePerShare,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(wellRegistry.exists(_wellId), "Well does not exist");
        require(_shares > 0, "Shares must be greater than 0");
        require(_pricePerShare > 0, "Price must be greater than 0");
        require(_duration >= 3600 && _duration <= 2592000, "Duration must be 1 hour to 30 days");
        
        // Check if seller has enough shares
        uint256 sellerShares = revenueSplitter.getInvestorShares(_wellId, msg.sender);
        require(sellerShares >= _shares, "Insufficient shares");
        
        uint256 listingId = nextListingId++;
        uint256 totalPrice = _shares.mul(_pricePerShare);
        
        listings[listingId] = Listing({
            wellId: _wellId,
            seller: msg.sender,
            shares: _shares,
            pricePerShare: _pricePerShare,
            totalPrice: totalPrice,
            expiryTime: block.timestamp + _duration,
            isActive: true,
            listingId: listingId
        });
        
        wellListings[_wellId].push(listingId);
        
        emit SharesListed(listingId, _wellId, msg.sender, _shares, _pricePerShare);
        
        return listingId;
    }
    
    /**
     * @dev Buy shares dari listing
     * @param _listingId ID listing
     */
    function buyShares(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        
        require(listing.isActive, "Listing not active");
        require(block.timestamp <= listing.expiryTime, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        
        // Check buyer balance
        require(
            stablecoin.balanceOf(msg.sender) >= listing.totalPrice,
            "Insufficient balance"
        );
        
        // Check seller still has shares
        uint256 sellerShares = revenueSplitter.getInvestorShares(listing.wellId, listing.seller);
        require(sellerShares >= listing.shares, "Seller insufficient shares");
        
        // Calculate marketplace fee
        uint256 fee = listing.totalPrice.mul(marketplaceFee).div(BASIS_POINTS);
        uint256 sellerAmount = listing.totalPrice.sub(fee);
        
        // Transfer payment
        stablecoin.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        stablecoin.safeTransferFrom(msg.sender, address(this), fee);
        
        // Transfer shares
        revenueSplitter.transferShares(listing.wellId, listing.seller, msg.sender, listing.shares);
        
        // Update last sale price
        wellLastSalePrice[listing.wellId] = listing.pricePerShare;
        
        // Deactivate listing
        listing.isActive = false;
        
        emit SharesSold(
            _listingId,
            listing.wellId,
            listing.seller,
            msg.sender,
            listing.shares,
            listing.totalPrice
        );
    }
    
    /**
     * @dev Cancel listing
     * @param _listingId ID listing
     */
    function cancelListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        
        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.isActive, "Listing not active");
        
        listing.isActive = false;
        
        emit ListingCancelled(_listingId);
    }
    
    /**
     * @dev Make offer untuk shares
     * @param _wellId ID sumur
     * @param _shares Jumlah shares yang ingin dibeli
     * @param _pricePerShare Harga yang ditawarkan per share
     * @param _duration Durasi offer dalam detik
     */
    function makeOffer(
        uint256 _wellId,
        uint256 _shares,
        uint256 _pricePerShare,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(wellRegistry.exists(_wellId), "Well does not exist");
        require(_shares > 0, "Shares must be greater than 0");
        require(_pricePerShare > 0, "Price must be greater than 0");
        require(_duration >= 3600 && _duration <= 2592000, "Duration must be 1 hour to 30 days");
        
        uint256 totalPrice = _shares.mul(_pricePerShare);
        
        // Check buyer balance
        require(
            stablecoin.balanceOf(msg.sender) >= totalPrice,
            "Insufficient balance"
        );
        
        // Lock funds (transfer to contract)
        stablecoin.safeTransferFrom(msg.sender, address(this), totalPrice);
        
        uint256 offerId = nextOfferId++;
        
        offers[offerId] = Offer({
            wellId: _wellId,
            buyer: msg.sender,
            shares: _shares,
            pricePerShare: _pricePerShare,
            totalPrice: totalPrice,
            expiryTime: block.timestamp + _duration,
            isActive: true,
            offerId: offerId
        });
        
        wellOffers[_wellId].push(offerId);
        
        emit OfferMade(offerId, _wellId, msg.sender, _shares, _pricePerShare);
        
        return offerId;
    }
    
    /**
     * @dev Accept offer
     * @param _offerId ID offer
     */
    function acceptOffer(uint256 _offerId) external nonReentrant {
        Offer storage offer = offers[_offerId];
        
        require(offer.isActive, "Offer not active");
        require(block.timestamp <= offer.expiryTime, "Offer expired");
        require(msg.sender != offer.buyer, "Cannot accept own offer");
        
        // Check seller has enough shares
        uint256 sellerShares = revenueSplitter.getInvestorShares(offer.wellId, msg.sender);
        require(sellerShares >= offer.shares, "Insufficient shares");
        
        // Calculate marketplace fee
        uint256 fee = offer.totalPrice.mul(marketplaceFee).div(BASIS_POINTS);
        uint256 sellerAmount = offer.totalPrice.sub(fee);
        
        // Transfer payment to seller
        stablecoin.safeTransfer(msg.sender, sellerAmount);
        // Fee stays in contract
        
        // Transfer shares
        revenueSplitter.transferShares(offer.wellId, msg.sender, offer.buyer, offer.shares);
        
        // Update last sale price
        wellLastSalePrice[offer.wellId] = offer.pricePerShare;
        
        // Deactivate offer
        offer.isActive = false;
        
        emit OfferAccepted(
            _offerId,
            offer.wellId,
            msg.sender,
            offer.buyer,
            offer.shares,
            offer.totalPrice
        );
    }
    
    /**
     * @dev Cancel offer dan return funds
     * @param _offerId ID offer
     */
    function cancelOffer(uint256 _offerId) external {
        Offer storage offer = offers[_offerId];
        
        require(offer.buyer == msg.sender, "Not offer owner");
        require(offer.isActive, "Offer not active");
        
        // Return locked funds
        stablecoin.safeTransfer(msg.sender, offer.totalPrice);
        
        offer.isActive = false;
        
        emit OfferCancelled(_offerId);
    }
    
    /**
     * @dev Get active listings untuk well
     * @param _wellId ID sumur
     */
    function getWellListings(uint256 _wellId) external view returns (uint256[] memory) {
        return wellListings[_wellId];
    }
    
    /**
     * @dev Get active offers untuk well
     * @param _wellId ID sumur
     */
    function getWellOffers(uint256 _wellId) external view returns (uint256[] memory) {
        return wellOffers[_wellId];
    }
    
    /**
     * @dev Get well market data
     * @param _wellId ID sumur
     */
    function getWellMarketData(uint256 _wellId) 
        external 
        view 
        returns (
            uint256 totalShares,
            uint256 lastSalePrice,
            uint256 valuation,
            uint256 activeListings,
            uint256 activeOffers
        ) 
    {
        totalShares = revenueSplitter.getTotalShares(_wellId);
        lastSalePrice = wellLastSalePrice[_wellId];
        valuation = wellValuation[_wellId];
        activeListings = wellListings[_wellId].length;
        activeOffers = wellOffers[_wellId].length;
    }
    
    /**
     * @dev Set well valuation (owner only)
     * @param _wellId ID sumur
     * @param _valuation Valuation baru
     */
    function setWellValuation(uint256 _wellId, uint256 _valuation) external onlyOwner {
        require(wellRegistry.exists(_wellId), "Well does not exist");
        
        wellValuation[_wellId] = _valuation;
        
        emit WellValuationUpdated(_wellId, _valuation);
    }
    
    /**
     * @dev Set marketplace fee (owner only)
     * @param _fee Fee baru dalam basis points
     */
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        marketplaceFee = _fee;
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = stablecoin.balanceOf(address(this));
        stablecoin.safeTransfer(owner(), balance);
    }
    
    /**
     * @dev Clean up expired listings dan offers
     * @param _listingIds Array listing IDs untuk cleanup
     * @param _offerIds Array offer IDs untuk cleanup
     */
    function cleanupExpired(
        uint256[] calldata _listingIds,
        uint256[] calldata _offerIds
    ) external {
        // Cleanup expired listings
        for (uint256 i = 0; i < _listingIds.length; i++) {
            Listing storage listing = listings[_listingIds[i]];
            if (listing.isActive && block.timestamp > listing.expiryTime) {
                listing.isActive = false;
                emit ListingCancelled(_listingIds[i]);
            }
        }
        
        // Cleanup expired offers dan return funds
        for (uint256 i = 0; i < _offerIds.length; i++) {
            Offer storage offer = offers[_offerIds[i]];
            if (offer.isActive && block.timestamp > offer.expiryTime) {
                stablecoin.safeTransfer(offer.buyer, offer.totalPrice);
                offer.isActive = false;
                emit OfferCancelled(_offerIds[i]);
            }
        }
    }
}