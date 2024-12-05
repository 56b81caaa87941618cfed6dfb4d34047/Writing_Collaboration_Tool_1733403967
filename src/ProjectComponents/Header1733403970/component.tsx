
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
  const [totalStaked, setTotalStaked] = React.useState<string>('0');

  const contractAddress = '0x8e8bF8E610F021A945b0bd58A14969bdd2FA27bE';
  const chainId = 17000; // Holesky testnet

  const contractABI = [
    "function stake(uint256 _amount) external",
    "function withdraw(uint256 _amount) external",
    "function claimRewards() external",
    "function calculateReward(address _user) public view returns (uint256)",
    "function stakingBalance(address) public view returns (uint256)",
    "function totalStaked() public view returns (uint256)"
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

        await updateBalances(stakingContract, address);
      }
    };

    init();
  }, []);

  const updateBalances = async (stakingContract: ethers.Contract, address: string) => {
    try {
      const stakedBalance = await stakingContract.stakingBalance(address);
      setStakedBalance(ethers.utils.formatEther(stakedBalance));

      const rewards = await stakingContract.calculateReward(address);
      setAvailableRewards(ethers.utils.formatEther(rewards));

      const totalStaked = await stakingContract.totalStaked();
      setTotalStaked(ethers.utils.formatEther(totalStaked));
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  const handleStake = async () => {
    if (!contract || !signer) return;
    try {
      const tx = await contract.stake(ethers.utils.parseEther(stakeAmount), {
        gasLimit: ethers.utils.hexlify(300000), // Adjust this value based on contract needs
      });
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
      const tx = await contract.withdraw(ethers.utils.parseEther(withdrawAmount));
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
      const tx = await contract.claimRewards();
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
        <p>Staked Balance: {stakedBalance} tokens</p>
        <p>Available Rewards: {availableRewards} tokens</p>
        <p>Total Staked in Contract: {totalStaked} tokens</p>
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
