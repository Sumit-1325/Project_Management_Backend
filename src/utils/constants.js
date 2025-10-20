export const userRolesEnum = {
    ADMIN: 'admin',
    USER: 'user',
    MEMBER : 'member',
    GUEST : 'guest'
};

export const availableUserRoles = Object.values(userRolesEnum);


export const projectStatusEnum = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress', 
    COMPLETED: 'completed',
    TODO : 'to_do',
};

export const availableProjectStatus = Object.values(projectStatusEnum);