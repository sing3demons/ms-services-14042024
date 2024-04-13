export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inActive',
}

export interface Todo {
    id: string;
    title: string;
    description?: string;
    done: boolean;
    startDate: string;
    endDate: string;
    status: Status;
}
