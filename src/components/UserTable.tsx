import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { USER_LIST as mockUsers } from '@/constants/mockData';
import { TABLE_TEXTS } from '@/constants/tableTexts';
import type { User } from '@/types/user';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import UserForm from './UserForm';

export default function UserTable() {
  // Convert mock user IDs to timestamps to ensure uniqueness
  const [users, setUsers] = useState<User[]>(() =>
    mockUsers.map((user) => ({
      ...user,
      id: Date.now() + Math.floor(Math.random() * 1000) // Add random number to ensure uniqueness in the same millisecond
    }))
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  type UserFormData = Omit<User, 'id'>;

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      setUserToDelete(null);
    }
  };

  const handleSubmit = (data: UserFormData) => {
    if (currentUser) {
      // Update existing user with new data but keep the timestamp ID
      setUsers(
        users.map((user) =>
          user.id === currentUser.id ? { ...data, id: currentUser.id } : user
        )
      );
    } else {
      // Add new user with a new timestamp-based ID
      // Adding a random number to ensure uniqueness even if called in the same millisecond
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      setUsers([...users, { ...data, id: newId }]);
    }
    setIsFormOpen(false);
  };

  return (
    <div
      className="container mx-auto py-4 sm:py-8"
      data-testid="user-table-container"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TABLE_TEXTS.PAGE_TITLE}</h1>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleAddUser}
          data-testid="add-user-button"
          aria-label="Add new user"
        >
          {TABLE_TEXTS.BUTTONS.ADD_USER}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full" data-testid="user-table">
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm sm:text-base w-[100px]">
                {TABLE_TEXTS.HEADERS.NAME}
              </TableHead>
              <TableHead className="text-sm sm:text-base w-[180px]">
                {TABLE_TEXTS.HEADERS.EMAIL}
              </TableHead>
              <TableHead className="text-sm sm:text-base w-[80px]">
                {TABLE_TEXTS.HEADERS.STATUS}
              </TableHead>
              <TableHead className="text-sm sm:text-base w-[200px]">
                {TABLE_TEXTS.HEADERS.DESCRIPTION}
              </TableHead>
              <TableHead className="w-[80px]">
                {TABLE_TEXTS.HEADERS.ACTIONS}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-sm sm:text-base truncate">
                  {user.name}
                </TableCell>
                <TableCell className="text-sm sm:text-base truncate">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive
                      ? TABLE_TEXTS.STATUS.ACTIVE
                      : TABLE_TEXTS.STATUS.INACTIVE}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm sm:text-base truncate">
                  {user.description}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                      className="w-full sm:w-auto"
                      data-testid={`edit-user-${user.id}-button`}
                      aria-label={`Edit user ${user.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full sm:w-auto"
                      onClick={() => handleDeleteClick(user)}
                      data-testid={`delete-user-${user.id}-button`}
                      aria-label={`Delete user ${user.name}`}
                    >
                      <Trash2
                        className="h-4 w-4 text-red-500"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={currentUser}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="delete-dialog-title">
              {TABLE_TEXTS.DELETE_DIALOG.TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="delete-dialog-description">
              確定要刪除使用者{' '}
              <span className="font-semibold">{userToDelete?.name}</span>{' '}
              嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-button">
              {TABLE_TEXTS.BUTTONS.CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="confirm-delete-button"
            >
              {TABLE_TEXTS.BUTTONS.CONFIRM_DELETE}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
