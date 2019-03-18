import React, { Component } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { formatDistance } from 'date-fns';
import Link from 'next/link';
import styled from 'styled-components';
import formatMoney from '../lib/formatMoney';
import OrderItemStyles from './styles/OrderItemStyles';

// const QUERY_ORDER_LIST = {
//     query orderList {

//     }
// }

class OrderList extends Component {
  render() {
    return <p>Orders List</p>;
  }
}

export default OrderList;
