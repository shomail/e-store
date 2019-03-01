import React, {Component} from 'react';

export default class Page extends Component {
  render() {
    return (
      <div>
        <nav>Navigation</nav>
        {this.props.children}
      </div>
    )
  }
}