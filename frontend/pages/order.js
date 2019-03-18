import PleaseSignin from '../components/PleaseSignin';

const Order = props => (
  <div>
    <PleaseSignin>
      <p>This is a single order {props.query.id}</p>
    </PleaseSignin>
  </div>
);

export default Order;
