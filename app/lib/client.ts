// Small fetch wrapper for client components: throws the API's error message on failure
export async function api<T = unknown>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
    const response = await fetch(url, {
        method: init?.method ?? "GET",
        headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
    return data as T;
}

export type Paginated<T> = { data: T[]; page: number; limit: number; total: number; totalPages: number };

export type Ad = {
    advertisement_id: number;
    company_id: number;
    title: string;
    description: string;
    location: string | null;
    contract_type: string | null;
    remote_status: string | null;
    category: string | null;
    salary: string | null;
    working_time: string | null;
    created_at: string;
    company: { id_company: number; name: string; description: string | null; person_id: number };
};

export type User = {
    person_id: number;
    first_name: string;
    name: string;
    pseudo: string | null;
    email: string;
    location: string;
    cellphone_number: string;
    role: string;
};

export type Evenement = {
    event_id:number;
    title:string;
    description:string;
    event_date:string;
    location:string;
    company_id:number | null;
    organizer_id:number;
    end_register_at:string | null;

};

export function formToObject(form: HTMLFormElement): Record<string, string> {
    return Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
}
