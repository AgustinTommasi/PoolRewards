// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// @author Agustin Tommasi

// @title Smart Contract Challenge
// https://github.com/exactly-finance/challenge

contract PoolRewards {
    struct Investment {
        address owner;
        uint256 amount;
        uint256 date;
        uint256 roundId;
    }
    struct Round {
        uint256 roundId;
        uint256 date;
        uint256 totalSupply;
        uint256 rewards;
    }

    mapping(address => bool) public team;

    Investment[] public investments;

    mapping(address => uint256[]) public account;

    Round[] public rounds;

    constructor() {
        team[msg.sender] = true;

        Round memory _round = Round({
            roundId: 0,
            date: block.timestamp,
            totalSupply: 0,
            rewards: 0
        });
        rounds.push(_round);
    }

    event InvestmentEvent(Investment investment);

    function invest() public payable {
        Investment memory _investment = Investment({
            owner: msg.sender,
            amount: msg.value,
            date: block.timestamp,
            roundId: rounds.length - 1
        });

        investments.push(_investment);

        account[msg.sender].push(investments.length - 1);
        emit InvestmentEvent(investments[investments.length - 1]);

        rounds[rounds.length - 1].totalSupply += msg.value;
    }

    event DepositRewardsEvent(Round round);

    function depositRewards() public payable onlyTeam {
        rounds[rounds.length - 1].rewards += msg.value;
        emit DepositRewardsEvent(rounds[rounds.length - 1]);

        Round memory _round = Round({
            roundId: rounds.length,
            date: block.timestamp,
            totalSupply: rounds[rounds.length - 1].totalSupply +
                rounds[rounds.length - 1].rewards,
            rewards: 0
        });
        rounds.push(_round);
    }

    event WithdrawEvent(Investment investment, Round round, uint256 amount);

    function withdraw() public {
        uint256 _totalAmount = 0;
        for (uint256 index = 0; index < account[msg.sender].length; index++) {
            uint256 _amount = investments[account[msg.sender][index]].amount;
            for (
                uint256 r = investments[account[msg.sender][index]].roundId;
                r < rounds.length;
                r++
            ) {
                _amount +=
                    (rounds[r].rewards * _amount) /
                    rounds[r].totalSupply;
                emit WithdrawEvent({
                    investment: investments[account[msg.sender][index]],
                    round: rounds[r],
                    amount: _amount
                });
            }

            _totalAmount += _amount;
        }

        delete account[msg.sender];

        payable(msg.sender).transfer(_totalAmount);
    }

    modifier onlyTeam() {
        require(team[msg.sender] == true, "Not part of the team");
        _;
    }

    function addTeammate(address _teammate) public onlyTeam {
        team[_teammate] = true;
    }

    function deleteTeammate(address _teammate) public onlyTeam {
        team[_teammate] = false;
    }
}
