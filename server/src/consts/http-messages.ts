export const HTTP_MESSAGES = {
  // Authentication Messages
  AUTH: {
    WRONG_PASSWORD: 'Incorrect password',
    WRONG_OLD_PASSWORD: 'Incorrect old password',
    INVALID_TOKEN: 'The provided token is invalid',
    TOKEN_EXPIRED: 'The token has expired',
  },

  // User Messages
  USER: {
    NOT_FOUND: 'User not found',
    PASSWORD_UPDATED: 'Password updated successfully',
    EXISTS: 'A user with this email already exists',
    NOT_ACTIVE: 'User account is not active',
  },

  // Company Messages
  COMPANY: {
    NOT_FOUND: 'Company not found',
    NOT_AUTHOR: 'You are not the author of this company',
  },

  // Notification Messages
  NOTIFICATION: {
    NOT_FOUND: 'Notification not found',
    ALREADY_READ: 'Notification has already been read',
  },

  // Role Messages
  ROLE: {
    NOT_EXIST: 'User does not have the required role',
    UPDATE_SUCCESS: 'User role updated successfully',
  },

  // General Messages
  GENERAL: {
    SUCCESS: 'Action completed successfully',
    FAILURE: 'Action could not be completed',
    ACCESS_DENIED: 'Access denied: Admins only',
  },

  // Member Messages
  MEMBER: {
    NOT_FOUND: 'Member not found',
    BLOCKED: 'Member blocked',
  },

  // Workspace Messages
  WORKSPACE: {
    NOT_FOUND: 'Workspace not found',
    REORDER_SUCCESS: 'Workspaces reordered successfully',
    INVALID_ID: 'Incorrect workspace ID',
  },

  // Sheet Messages
  SHEET: {
    NOT_FOUND: 'Sheet not found',
    REORDER_SUCCESS: 'Sheets reordered successfully',
    DELETE_SUCCESS: 'Sheet deleted successfully',
    DELETE_MULTIPLE_SUCCESS: 'Multiple sheets deleted successfully',
    INVALID_IDS: 'Invalid sheet IDs',
  },

  // Plan Messages
  PLAN: {
    NOT_FOUND: 'Plan not found',
  },

  // Select Messages
  SELECT: {
    NOT_FOUND: 'Select not found',
    DELETE_SUCCESS: 'Select deleted successfully',
    DELETE_MULTIPLE_SUCCESS: 'Multiple selects deleted successfully',
  },

  // Column Messages
  COLUMN: {
    NOT_FOUND: 'Column not found',
    DELETE_SUCCESS: 'Column deleted successfully',
    INVALID_TYPE: 'Invalid column type or type limit exceeded',
    LIMIT: 'No available space for this column type in the sheet.',
  },

  // Task Messages
  TASK: {
    NOT_FOUND: 'Task not found',
    DELETE_SUCCESS: 'Task deleted successfully',
    REORDER_SUCCESS: 'Tasks reordered successfully',
    MOVE_SUCCESS: 'Task moved successfully',
  },

  // Option Messages
  OPTION: {
    NOT_FOUND: 'Option not found',
    DELETE_SUCCESS: 'Option deleted successfully',
  },
}
