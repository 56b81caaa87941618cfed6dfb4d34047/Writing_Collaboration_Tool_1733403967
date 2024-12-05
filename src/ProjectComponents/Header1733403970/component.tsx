
import React from 'react';
import { ethers } from 'ethers';

const StakingComponent: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = React.useState<ethers.Signer | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [account, setAccount] = React.useState<string>('');
  const [stakeAmount, setStakeAmount] = React.useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = React.useState<string>('');
  const [stakedBalance, setStakedBalance] = React.useState<string>('0');
  const [availableRewards, setAvailableRewards] = React.useState<string>('0');
  const [stakingTokenAddress, setStakingTokenAddress] = React.useState<string>('');
  const [rewardRate, setRewardRate] = React.useState<string>('0');

  const contractAddress = '0xE700a435e00d00391d466f79AB711754F5294a2e';
  const chainId = 11155111; // Sepolia testnet

  const contractABI = [
    "function stakingToken() public view returns (address)",
    "function rewardRate() public view returns (uint256)",
    "function stakingBalance(address) public view returns (uint256)",
    "function calculateReward(address _user) public view returns (uint256)",
    "function stake(uint256 _amount) external",
    "function withdraw(uint256 _amount) external",
    "function claimRewards() external"
  ];

  React.useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        
        const network = await web3Provider.getNetwork();
        if (network.chainId !== chainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: ethers.utils.hexValue(chainId) }],
            });
          } catch (error) {
            console.error("Failed to switch network:", error);
            return;
          }
        }

        const signer = web3Provider.getSigner();
        setSigner(signer);

        const stakingContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(stakingContract);

        const address = await signer.getAddress();
        setAccount(address);

        await updateContractInfo(stakingContract);
        await updateBalances(stakingContract, address);
      }
    };

    init();
  }, []);

  const updateContractInfo = async (stakingContract: ethers.Contract) => {
    try {
      const tokenAddress = await stakingContract.stakingToken();
      setStakingTokenAddress(tokenAddress);

      const rate = await stakingContract.rewardRate();
      setRewardRate(ethers.utils.formatUnits(rate, 18));
    } catch (error) {
      console.error("Error updating contract info:", error);
    }
  };

  const updateBalances = async (stakingContract: ethers.Contract, address: string) => {
    try {
      const stakedBalance = await stakingContract.stakingBalance(address);
      setStakedBalance(ethers.utils.formatEther(stakedBalance));

      const rewards = await stakingContract.calculateReward(address);
      setAvailableRewards(ethers.utils.formatEther(rewards));
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  const estimateGas = async (transaction: () => Promise<ethers.ContractTransaction>): Promise<string> => {
    try {
      const tx = await transaction();
      const gasLimit = await tx.estimateGas();
      return gasLimit.mul(120).div(100).toString(); // Add 20% buffer
    } catch (error) {
      console.error("Error estimating gas:", error);
      return ethers.utils.hexlify(300000); // Fallback gas limit
    }
  };

  const handleStake = async () => {
    if (!contract || !signer) return;
    try {
      const gasLimit = await estimateGas(() => contract.stake(ethers.utils.parseEther(stakeAmount)));
      const tx = await contract.stake(ethers.utils.parseEther(stakeAmount), { gasLimit });
      await tx.wait();
      await updateBalances(contract, account);
      setStakeAmount('');
    } catch (error) {
      console.error("Error staking:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !signer) return;
    try {
      const gasLimit = await estimateGas(() => contract.withdraw(ethers.utils.parseEther(withdrawAmount)));
      const tx = await contract.withdraw(ethers.utils.parseEther(withdrawAmount), { gasLimit });
      await tx.wait();
      await updateBalances(contract, account);
      setWithdrawAmount('');
    } catch (error) {
      console.error("Error withdrawing:", error);
    }
  };

  const handleClaimRewards = async () => {
    if (!contract || !signer) return;
    try {
      const gasLimit = await estimateGas(() => contract.claimRewards());
      const tx = await contract.claimRewards({ gasLimit });
      await tx.wait();
      await updateBalances(contract, account);
    } catch (error) {
      console.error("Error claiming rewards:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Staking Contract Interaction</h1>
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <p>Connected Account: {account}</p>
        <p>Staking Token Address: {stakingTokenAddress}</p>
        <p>Reward Rate: {rewardRate} tokens per second per staked token</p>
        <p>Staked Balance: {stakedBalance} tokens</p>
        <p>Available Rewards: {availableRewards} tokens</p>
      </div>
      <div className="mb-4">
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake"
          className="border rounded p-2 mr-2"
        />
        <button onClick={handleStake} className="bg-blue-500 text-white px-4 py-2 rounded">
          Stake
        </button>
      </div>
      <div className="mb-4">
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Amount to withdraw"
          className="border rounded p-2 mr-2"
        />
        <button onClick={handleWithdraw} className="bg-green-500 text-white px-4 py-2 rounded">
          Withdraw
        </button>
      </div>
      <button onClick={handleClaimRewards} className="bg-yellow-500 text-white px-4 py-2 rounded">
        Claim Rewards
      </button>
    </div>
  );
};

export { StakingComponent as component };
