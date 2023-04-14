# Environment: development
- env: hardhat

# Step 1: Install dependencies
```shell
npm install
```
or
```shell
yarn
```

# Step 2: Compile
```shell
npx hardhat compile
```

# Step 3: Test
```shell
npx hardhat test
```

# Step 4: Deploy
## require!!!
you should set the PRIVATE_KEY environment in .env file, if not exist, create it.

```shell
npm run deploy-StakeSpacePi
npm run deploy-ERC731Distributior
```
