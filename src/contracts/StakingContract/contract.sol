
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract StakingContract is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    uint256 public rewardRate;
    uint256 public totalStaked;

    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 reward);

    constructor() Ownable() {
        stakingToken = IERC20(0x1234567890123456789012345678901234567890); // Placeholder address
        rewardRate = 1e15; // 0.001 tokens per second per staked token
    }

    function setStakingToken(address _stakingToken) external onlyOwner {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Cannot stake 0 tokens");
        updateReward(msg.sender);
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        stakingBalance[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Cannot withdraw 0 tokens");
        require(stakingBalance[msg.sender] >= _amount, "Insufficient staked balance");
        updateReward(msg.sender);
        stakingBalance[msg.sender] -= _amount;
        totalStaked -= _amount;
        stakingToken.safeTransfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function claimRewards() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards to claim");
        updateReward(msg.sender);
        stakingToken.safeTransfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function calculateReward(address _user) public view returns (uint256) {
        uint256 stakedAmount = stakingBalance[_user];
        if (stakedAmount == 0) {
            return 0;
        }
        uint256 stakingDuration = block.timestamp - stakingTimestamp[_user];
        return stakedAmount * stakingDuration * rewardRate / 1e18;
    }

    function updateReward(address _user) internal {
        stakingTimestamp[_user] = block.timestamp;
    }
}
