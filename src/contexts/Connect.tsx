import React from 'react';
import {
  web3Enable,
  web3AccountsSubscribe,
} from '@polkadot/extension-dapp';

// context type
export interface ConnectContextState {
  connect: () => void,
  disconnect: () => void;
  setAccounts: () => void;
  setActiveAccount: (a: string) => void;
  status: number,
  accounts: any;
  activeAccount: any;
}

// context definition
export const ConnectContext: React.Context<ConnectContextState> = React.createContext({
  status: 0,
  connect: () => { },
  disconnect: () => { },
  setAccounts: () => { },
  setActiveAccount: (a: string) => { },
  accounts: [],
  activeAccount: {},
});

// useAssistant
export const useConnect = () => React.useContext(ConnectContext);

// wrapper component to provide components with context
export class ConnectContextWrapper extends React.Component {

  state = {
    status: 0,
    accounts: [],
    activeAccount: {},
    unsubscribe: () => { },
  };

  // automatically connect to web3 (will work if already authorized)
  // 'auto connect' should be a toggle stored in localStorage for user-set auto connect.
  componentDidMount () {
    this.subscribeWeb3Accounts();
  }

  subscribeWeb3Accounts = async () => {

    // attempt to connect to Polkadot JS extension
    const extensions = await web3Enable('rb_polkadot_staking');

    // no extension found
    if (extensions.length === 0) {
      return;
    }

    let accounts: any = [];

    // fetch accounts and subscribe to account changes
    const unsubscribe = await web3AccountsSubscribe((injectedAccounts) => {
      injectedAccounts.map((account) => {

        const { address, meta } = account;
        const { name, source } = meta;

        // format accounts into standard app format
        accounts.push({
          address: address,
          name: name,
          source: source
        });

        this.setState({
          status: 1,
          accounts: accounts,
          activeAccount: accounts[0],
        });
      })
    }, { ss58Format: 0 });

    this.setState({
      ...this.state,
      unsubscribe: unsubscribe,
    })
  }

  componentWillUnmount () {
    this.state.unsubscribe();
  }

  connect = () => {
    this.setState({ ...this.state, status: 1 });
  }

  disconnect = () => {
    this.setState({
      status: 0,
      accounts: [],
      activeAccount: {},
      unsubscribe: () => { },
    });
  }

  setAccounts = () => {
    // subscribe to accounts via polkadot.js extension
    this.subscribeWeb3Accounts();
  }

  setActiveAccount = (address: string) => {
    const account = this.state.accounts.find((item: any) => {
      return (item.address === address);
    });

    this.setState({
      ...this.state,
      activeAccount: account
    });
  }

  render () {
    return (
      <ConnectContext.Provider value={{
        status: this.state.status,
        accounts: this.state.accounts,
        activeAccount: this.state.activeAccount,
        connect: this.connect,
        disconnect: this.disconnect,
        setAccounts: this.setAccounts,
        setActiveAccount: this.setActiveAccount,
      }}>
        {this.props.children}
      </ConnectContext.Provider>
    );
  }
}