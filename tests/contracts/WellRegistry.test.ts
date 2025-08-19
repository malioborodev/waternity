// Unit Tests for WellRegistry Smart Contract
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { WellRegistry } from '../../src/contracts/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('WellRegistry Contract', function () {
  let wellRegistry: WellRegistry;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let investor: SignerWithAddress;
  let user: SignerWithAddress;

  const MOCK_NFT_TOKEN_ID = '0.0.12345';
  const MOCK_FRACTIONAL_TOKEN_ID = '0.0.12346';
  const MOCK_HCS_TOPIC_ID = '0.0.12347';

  beforeEach(async function () {
    [owner, operator, investor, user] = await ethers.getSigners();
    
    const WellRegistryFactory = await ethers.getContractFactory('WellRegistry');
    wellRegistry = await WellRegistryFactory.deploy();
    await wellRegistry.deployed();
  });

  describe('Well Registration', function () {
    it('Should register a new well successfully', async function () {
      const wellData = {
        name: 'Test Well #1',
        location: 'Jakarta, Indonesia',
        capacity: 1000, // 1000 liters per day
        pricePerLiter: ethers.utils.parseUnits('0.05', 18), // $0.05 per liter
        nftTokenId: MOCK_NFT_TOKEN_ID,
        fractionalTokenId: MOCK_FRACTIONAL_TOKEN_ID,
        hcsTopicId: MOCK_HCS_TOPIC_ID
      };

      await expect(
        wellRegistry.connect(operator).registerWell(
          wellData.name,
          wellData.location,
          wellData.capacity,
          wellData.pricePerLiter,
          wellData.nftTokenId,
          wellData.fractionalTokenId,
          wellData.hcsTopicId
        )
      ).to.emit(wellRegistry, 'WellRegistered')
        .withArgs(1, operator.address, wellData.nftTokenId);

      const well = await wellRegistry.getWell(1);
      expect(well.name).to.equal(wellData.name);
      expect(well.operator).to.equal(operator.address);
      expect(well.capacity).to.equal(wellData.capacity);
      expect(well.pricePerLiter).to.equal(wellData.pricePerLiter);
      expect(well.isActive).to.be.true;
    });

    it('Should fail to register well with invalid parameters', async function () {
      await expect(
        wellRegistry.connect(operator).registerWell(
          '', // Empty name
          'Location',
          1000,
          ethers.utils.parseUnits('0.05', 18),
          MOCK_NFT_TOKEN_ID,
          MOCK_FRACTIONAL_TOKEN_ID,
          MOCK_HCS_TOPIC_ID
        )
      ).to.be.revertedWith('Invalid well name');

      await expect(
        wellRegistry.connect(operator).registerWell(
          'Test Well',
          'Location',
          0, // Zero capacity
          ethers.utils.parseUnits('0.05', 18),
          MOCK_NFT_TOKEN_ID,
          MOCK_FRACTIONAL_TOKEN_ID,
          MOCK_HCS_TOPIC_ID
        )
      ).to.be.revertedWith('Invalid capacity');
    });

    it('Should prevent duplicate NFT token registration', async function () {
      // Register first well
      await wellRegistry.connect(operator).registerWell(
        'Test Well #1',
        'Location 1',
        1000,
        ethers.utils.parseUnits('0.05', 18),
        MOCK_NFT_TOKEN_ID,
        MOCK_FRACTIONAL_TOKEN_ID,
        MOCK_HCS_TOPIC_ID
      );

      // Try to register another well with same NFT token
      await expect(
        wellRegistry.connect(operator).registerWell(
          'Test Well #2',
          'Location 2',
          2000,
          ethers.utils.parseUnits('0.06', 18),
          MOCK_NFT_TOKEN_ID, // Same NFT token
          '0.0.12348',
          '0.0.12349'
        )
      ).to.be.revertedWith('NFT token already registered');
    });
  });

  describe('Well Management', function () {
    beforeEach(async function () {
      await wellRegistry.connect(operator).registerWell(
        'Test Well',
        'Test Location',
        1000,
        ethers.utils.parseUnits('0.05', 18),
        MOCK_NFT_TOKEN_ID,
        MOCK_FRACTIONAL_TOKEN_ID,
        MOCK_HCS_TOPIC_ID
      );
    });

    it('Should allow operator to update well status', async function () {
      await expect(
        wellRegistry.connect(operator).setWellStatus(1, false)
      ).to.emit(wellRegistry, 'WellStatusChanged')
        .withArgs(1, false);

      const well = await wellRegistry.getWell(1);
      expect(well.isActive).to.be.false;
    });

    it('Should prevent non-operator from updating well status', async function () {
      await expect(
        wellRegistry.connect(user).setWellStatus(1, false)
      ).to.be.revertedWith('Only well operator');
    });

    it('Should allow operator to update pricing', async function () {
      const newPrice = ethers.utils.parseUnits('0.08', 18);
      
      await expect(
        wellRegistry.connect(operator).updateWellPricing(1, newPrice)
      ).to.emit(wellRegistry, 'WellPricingUpdated')
        .withArgs(1, newPrice);

      const well = await wellRegistry.getWell(1);
      expect(well.pricePerLiter).to.equal(newPrice);
    });

    it('Should track total volume dispensed', async function () {
      const volume = ethers.utils.parseUnits('50', 18); // 50 liters
      
      await wellRegistry.connect(operator).recordWaterDispensed(1, volume);
      
      const well = await wellRegistry.getWell(1);
      expect(well.totalVolumeDispensed).to.equal(volume);
    });
  });

  describe('Well Queries', function () {
    beforeEach(async function () {
      // Register multiple wells
      await wellRegistry.connect(operator).registerWell(
        'Well 1', 'Location 1', 1000, ethers.utils.parseUnits('0.05', 18),
        '0.0.1001', '0.0.1002', '0.0.1003'
      );
      await wellRegistry.connect(operator).registerWell(
        'Well 2', 'Location 2', 2000, ethers.utils.parseUnits('0.06', 18),
        '0.0.1004', '0.0.1005', '0.0.1006'
      );
      await wellRegistry.connect(user).registerWell(
        'Well 3', 'Location 3', 1500, ethers.utils.parseUnits('0.07', 18),
        '0.0.1007', '0.0.1008', '0.0.1009'
      );
    });

    it('Should return correct well count', async function () {
      const count = await wellRegistry.getWellCount();
      expect(count).to.equal(3);
    });

    it('Should return wells by operator', async function () {
      const operatorWells = await wellRegistry.getWellsByOperator(operator.address);
      expect(operatorWells.length).to.equal(2);
      expect(operatorWells[0]).to.equal(1);
      expect(operatorWells[1]).to.equal(2);

      const userWells = await wellRegistry.getWellsByOperator(user.address);
      expect(userWells.length).to.equal(1);
      expect(userWells[0]).to.equal(3);
    });

    it('Should return active wells only', async function () {
      // Deactivate one well
      await wellRegistry.connect(operator).setWellStatus(2, false);
      
      const activeWells = await wellRegistry.getActiveWells();
      expect(activeWells.length).to.equal(2);
      expect(activeWells).to.include(1);
      expect(activeWells).to.include(3);
      expect(activeWells).to.not.include(2);
    });

    it('Should find well by NFT token ID', async function () {
      const wellId = await wellRegistry.getWellByNFT('0.0.1004');
      expect(wellId).to.equal(2);
      
      await expect(
        wellRegistry.getWellByNFT('0.0.9999')
      ).to.be.revertedWith('Well not found');
    });
  });

  describe('Access Control', function () {
    it('Should have correct owner', async function () {
      expect(await wellRegistry.owner()).to.equal(owner.address);
    });

    it('Should allow owner to pause/unpause contract', async function () {
      await wellRegistry.connect(owner).pause();
      expect(await wellRegistry.paused()).to.be.true;
      
      await expect(
        wellRegistry.connect(operator).registerWell(
          'Test Well', 'Location', 1000, ethers.utils.parseUnits('0.05', 18),
          MOCK_NFT_TOKEN_ID, MOCK_FRACTIONAL_TOKEN_ID, MOCK_HCS_TOPIC_ID
        )
      ).to.be.revertedWith('Pausable: paused');
      
      await wellRegistry.connect(owner).unpause();
      expect(await wellRegistry.paused()).to.be.false;
    });

    it('Should prevent non-owner from pausing', async function () {
      await expect(
        wellRegistry.connect(operator).pause()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Events', function () {
    it('Should emit correct events for well lifecycle', async function () {
      // Registration event
      await expect(
        wellRegistry.connect(operator).registerWell(
          'Test Well', 'Location', 1000, ethers.utils.parseUnits('0.05', 18),
          MOCK_NFT_TOKEN_ID, MOCK_FRACTIONAL_TOKEN_ID, MOCK_HCS_TOPIC_ID
        )
      ).to.emit(wellRegistry, 'WellRegistered');

      // Status change event
      await expect(
        wellRegistry.connect(operator).setWellStatus(1, false)
      ).to.emit(wellRegistry, 'WellStatusChanged');

      // Pricing update event
      await expect(
        wellRegistry.connect(operator).updateWellPricing(1, ethers.utils.parseUnits('0.08', 18))
      ).to.emit(wellRegistry, 'WellPricingUpdated');

      // Water dispensed event
      await expect(
        wellRegistry.connect(operator).recordWaterDispensed(1, ethers.utils.parseUnits('100', 18))
      ).to.emit(wellRegistry, 'WaterDispensed');
    });
  });
});