import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import Table from './styles/Table';

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE',
];

const ALL_USERS_QUERY = gql`
  query ALL_USERS_QUERY {
    users {
      id
      name
      email
      permissions
    }
  }
`;

const Permissions = props => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) => (
      <>
        <Error error={error} />
        <h2>Manage Permissions</h2>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              {possiblePermissions.map(permission => (
                <th>{permission}</th>
              ))}
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map(user => (
              <User user={user} />
            ))}
          </tbody>
        </Table>
      </>
    )}
  </Query>
);

class User extends React.Component {
  render() {
    const {user} = this.props;
    return (
      <tr>
        <td>{user.name}</td>
        <td>{user.email}</td>
      </tr>
    );
  }
}

export default Permissions;
