export type Paginated<T> = {
    data: T[];
    total?: number;
    current_page?: number;
    last_page?: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};
