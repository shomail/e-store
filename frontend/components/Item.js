import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Item extends Component {
  static PropTypes = {
    item: PropTypes.object.isRequired,
  };

  render() {
    return <div />;
  }
}
