// Describes every table exposed by the CRUD API and the admin page
// Client-safe: no server imports here

export type FieldType = "string" | "text" | "int" | "datetime" | "select" | "password";

export type Field = {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    readOnly?: boolean;
    options?: string[];
    // Shown as a column in admin tables
    list?: boolean;
};

export type Resource = {
    slug: string;
    label: string;
    model: "people" | "company" | "advertisements" | "applications" | "messages" | "events";
    idKey: string;
    bigintId?: boolean;
    // GET is open to everyone (e.g. job ads); everything else is admin-only
    publicRead?: boolean;
    searchKeys: string[];
    orderBy: Record<string, "asc" | "desc">;
    include?: Record<string, unknown>;
    fields: Field[];
};

export const ROLES = ["candidate", "recruiter", "meeter", "admin"];
export const CONTRACT_TYPES = ["CDI", "CDD", "Internship", "Apprenticeship", "Freelance"];
export const REMOTE_STATUSES = ["On-site", "Hybrid", "Full-Remote"];

export const RESOURCES: Resource[] = [
    {
        slug: "ads",
        label: "Advertisements",
        model: "advertisements",
        idKey: "advertisement_id",
        publicRead: true,
        searchKeys: ["title", "description", "location", "category"],
        orderBy: { created_at: "desc" },
        include: { company: { select: { id_company: true, name: true, description: true, person_id: true } } },
        fields: [
            { key: "advertisement_id", label: "ID", type: "int", readOnly: true, list: true },
            { key: "title", label: "Title", type: "string", required: true, list: true },
            { key: "company_id", label: "Company ID", type: "int", required: true, list: true },
            { key: "description", label: "Description", type: "text", required: true },
            { key: "location", label: "Location", type: "string", list: true },
            { key: "contract_type", label: "Contract", type: "select", options: CONTRACT_TYPES, list: true },
            { key: "remote_status", label: "Remote", type: "select", options: REMOTE_STATUSES },
            { key: "category", label: "Category", type: "string" },
            { key: "salary", label: "Salary", type: "string" },
            { key: "working_time", label: "Working time", type: "string" },
            { key: "created_at", label: "Created", type: "datetime", readOnly: true, list: true },
        ],
    },
    {
        slug: "companies",
        label: "Companies",
        model: "company",
        idKey: "id_company",
        publicRead: true,
        searchKeys: ["name", "description"],
        orderBy: { id_company: "asc" },
        fields: [
            { key: "id_company", label: "ID", type: "int", readOnly: true, list: true },
            { key: "name", label: "Name", type: "string", required: true, list: true },
            { key: "person_id", label: "Owner (person ID)", type: "int", required: true, list: true },
            { key: "description", label: "Description", type: "text", list: true },
        ],
    },
    {
        slug: "people",
        label: "People",
        model: "people",
        idKey: "person_id",
        searchKeys: ["first_name", "name", "email", "pseudo", "location"],
        orderBy: { person_id: "asc" },
        fields: [
            { key: "person_id", label: "ID", type: "int", readOnly: true, list: true },
            { key: "first_name", label: "First name", type: "string", required: true, list: true },
            { key: "name", label: "Last name", type: "string", required: true, list: true },
            { key: "pseudo", label: "Pseudo", type: "string" },
            { key: "email", label: "Email", type: "string", required: true, list: true },
            { key: "location", label: "Location", type: "string", required: true },
            { key: "cellphone_number", label: "Phone", type: "string", required: true },
            { key: "status", label: "Status", type: "string", required: true },
            { key: "role", label: "Role", type: "select", options: ROLES, required: true, list: true },
            { key: "password", label: "Password", type: "password" },
        ],
    },
    {
        slug: "applications",
        label: "Applications",
        model: "applications",
        idKey: "application_id",
        searchKeys: ["message"],
        orderBy: { applied_at: "desc" },
        fields: [
            { key: "application_id", label: "ID", type: "int", readOnly: true, list: true },
            { key: "person_id", label: "Person ID", type: "int", required: true, list: true },
            { key: "advertisement_id", label: "Ad ID", type: "int", required: true, list: true },
            { key: "message", label: "Message", type: "text", list: true },
            { key: "resume_url", label: "Resume URL", type: "string" },
            { key: "applied_at", label: "Applied", type: "datetime", readOnly: true, list: true },
        ],
    },
    {
        slug: "messages",
        label: "Messages",
        model: "messages",
        idKey: "message_id",
        bigintId: true,
        searchKeys: ["content"],
        orderBy: { sent_at: "desc" },
        fields: [
            { key: "message_id", label: "ID", type: "int", readOnly: true, list: true },
            { key: "sender_id", label: "Sender ID", type: "int", required: true, list: true },
            { key: "receiver_id", label: "Receiver ID", type: "int", required: true, list: true },
            { key: "application_id", label: "Application ID", type: "int", list: true },
            { key: "content", label: "Content", type: "text", required: true, list: true },
            { key: "sent_at", label: "Sent", type: "datetime", readOnly: true, list: true },
            { key: "read_at", label: "Read at", type: "datetime" },
        ],
    },
    {
        slug: "events",
        label: "Events",
        model: "events",
        idKey: "event_id",
        publicRead: true,
        searchKeys: ["title", "description", "location"],
        orderBy: { event_date: "asc" },
        fields: [
            { key: "event_id", label: "ID", type: "int", readOnly: true, list: true },
            { key: "title", label: "Title", type: "string", required: true, list: true },
            { key: "description", label: "Description", type: "text", required: true },
            { key: "event_date", label: "Date", type: "datetime", required: true, list: true },
            { key: "location", label: "Location", type: "string", required: true, list: true },
            { key: "company_id", label: "Company ID", type: "int" },
            { key: "organizer_id", label: "Organizer ID", type: "int", required: true, list: true },
            { key: "end_register_at", label: "Registration ends", type: "datetime" },
        ],
    },
];

export function getResource(slug: string): Resource {
    const resource = RESOURCES.find((r) => r.slug === slug);
    if (!resource) throw new Error(`Unknown resource ${slug}`);
    return resource;
}
