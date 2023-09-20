import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Input,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import axios from "axios";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    axios.get("http://localhost:4000/auth/users").then((response) => {
      setUsers(response.data);
    });
  }, []);

  const editUser = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    onOpen();
  };

  const deleteUser = (userId) => {
    axios
      .delete(`http://localhost:4000/auth/admin/users/${userId}`)
      .then(() => {
        const updatedUsers = users.filter((user) => user._id !== userId);
        setUsers(updatedUsers);
      })
      .catch((error) => {
        console.error("Error al eliminar el usuario:", error);
      });
  };

  const saveUserChanges = () => {
    axios
      .put(`http://localhost:4000/auth/admin/users/${selectedUser._id}/role`, {
        role: newRole,
      })
      .then(() => {
        const updatedUsers = users.map((user) =>
          user._id === selectedUser._id ? { ...user, role: newRole } : user
        );
        setUsers(updatedUsers);
        onClose();
      })
      .catch((error) => {
        console.error("Error al actualizar el rol del usuario:", error);
      });
  };

  return (
    <div>
      <nav>
        <ul className="admin-menu">
          <li>
            <Link to="/admin">Home</Link>
          </li>
          <li>
            <Link to="/admin/orders">Order</Link>
          </li>
          <li>
            <Link to="/admin/products">Products</Link>
          </li>
          <li>
            <Link to="/AdminUsers">Users</Link>
          </li>
        </ul>
      </nav>
      <Box mt={10}>
        <Text fontSize="2xl" p={5}>
          Orders
        </Text>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user._id}>
                <Td>{user.email}</Td>
                <Td>{user.role}</Td>
                <Td>
                  <Button onClick={() => editUser(user)}>Edit</Button>
                  <Button onClick={() => deleteUser(user._id)}>Delete</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {selectedUser && (
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit User</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text>Email: {selectedUser.email}</Text>
                <Text>Current Role: {selectedUser.role}</Text>
                <Input
                  placeholder="New Role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={saveUserChanges}>
                  Save
                </Button>
                <Button onClick={onClose}>Cancel</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </Box>
    </div>
  );
}

export default UserManagement;
