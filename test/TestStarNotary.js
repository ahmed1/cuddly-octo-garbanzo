const StarNotary = artifacts.require('StarNotary');

var accounts;
var owner;

contract('StarNotary', (accs) => {
	accounts = accs;
	owner = accounts[0];
});

it('can Create a Star', async () => {
	let tokenId = 1;
	let instance = await StarNotary.deployed();

	await instance.createStar('Awesome Star!', 'as', tokenId, { from: accounts[0] });
	let star = await instance.tokenIdToStarInfo.call(tokenId);
	assert.equal(star.name, 'Awesome Star!');
});

it('lets user1 put up their star for sale', async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let starId = 2;
	let starPrice = web3.utils.toWei('.01', 'ether');
	await instance.createStar('awesome star', 'as', starId, { from: user1 });
	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId = 3;
	let starPrice = web3.utils.toWei('.01', 'ether');
	let balance = web3.utils.toWei('.05', 'ether');
	await instance.createStar('awesome star', 'as', starId, { from: user1 });

	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
	let result = await instance.buyStar(starId, { from: user2, value: balance });

	let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
	// let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
	let value1 = web3.utils.toBN(balanceOfUser1BeforeTransaction).add(web3.utils.toBN(starPrice));
	// let value2 = Number(balanceOfUser1AfterTransaction);
	let value2 = web3.utils.toBN(balanceOfUser1AfterTransaction);
	assert.equal(value1.eq(value2), true);
});

it('lets user2 buy a star, if it is put up for sale', async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId = 4;
	let starPrice = web3.utils.toWei('.01', 'ether');
	let balance = web3.utils.toWei('.05', 'ether');
	await instance.createStar('awesome star', 'as', starId, { from: user1 });
	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	await instance.buyStar(starId, { from: user2, value: balance });
	assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId = 5;
	let starPrice = web3.utils.toWei('.01', 'ether');
	let balance = web3.utils.toWei('.05', 'ether');
	await instance.createStar('awesome star', 'as', starId, { from: user1 });
	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);

	let gasPrice = web3.utils.toWei('20', 'gwei');
	let receipt = await instance.buyStar(starId, { from: user2, value: balance, gasPrice: gasPrice });
	let gasUsed = receipt.receipt.gasUsed;
	let gasCost = web3.utils.toBN(gasUsed).mul(web3.utils.toBN(gasPrice));
	const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);

	let value = web3.utils
		.toBN(balanceOfUser2BeforeTransaction)
		.sub(web3.utils.toBN(balanceAfterUser2BuysStar))
		.sub(gasCost);

	assert.equal(value.eq(web3.utils.toBN(starPrice)), true);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async () => {
	// 1. create a Star with different tokenId
	//2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let starId = 6;
	let starName = 'awesome star';
	let starSymbol = 'as';
	await instance.createStar(starName, starSymbol, starId, { from: user1 });

	let name = await instance.lookUptokenIdToStarInfo(starId, { from: user1 });
	let symbol = await instance.lookUptokenIdToStarSymbol(starId, { from: user1 });
	assert.equal(name, starName);
	assert.equal(symbol, starSymbol);
});

it('lets 2 users exchange stars', async () => {
	// 1. create 2 Stars with different tokenId
	// 2. Call the exchangeStars functions implemented in the Smart Contract
	// 3. Verify that the owners changed

	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId1 = 7;
	let starName1 = 'Star 1';
	let starSymbol1 = 'St1';
	let starName2 = 'Star 2';
	let starSymbol2 = 'St2';
	let starId2 = 8;
	await instance.createStar(starName1, starSymbol1, starId1, { from: user1 });
	await instance.createStar(starName2, starSymbol2, starId2, { from: user2 });
	await instance.exchangeStars(starId1, starId2, { from: user1 });

	let newOwner1 = await instance.ownerOf(starId1);
	let newOwner2 = await instance.ownerOf(starId2);

	assert.equal(newOwner1, user2);
	assert.equal(newOwner2, user1);
});

it('lets a user transfer a star', async () => {
	// 1. create a Star with different tokenId
	// 2. use the transferStar function implemented in the Smart Contract
	// 3. Verify the star owner changed.
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId = 9;
	let starName = 'Star 1';
	let starSymbol = 'St1';
	await instance.createStar(starName, starSymbol, starId, { from: user1 });
	await instance.transferStar(user2, starId, { from: user1 });

	let newOwner = await instance.ownerOf(starId);

	assert.equal(newOwner, user2);
});

it('lookUptokenIdToStarInfo test', async () => {
	// 1. create a Star with different tokenId
	// 2. Call your method lookUptokenIdToStarInfo
	// 3. Verify if you Star name is the same
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let starId = 10;
	let starName = 'Star 1';
	let starSymbol = 'St1';
	await instance.createStar(starName, starSymbol, starId, { from: user1 });

	let name = await instance.lookUptokenIdToStarInfo(starId);

	assert.equal(starName, name);
});
