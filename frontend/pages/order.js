import PleaseSignin from '../components/PleaseSignin';
import Order from '../components/Order';

const OrderPage = ({ query: { id } }) => (
  <div>
    <PleaseSignin>
      <Order id={id} />
    </PleaseSignin>
  </div>
);

export default OrderPage;
