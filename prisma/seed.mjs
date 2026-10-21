// Fills the database through the backend's ORM. Run with: npm run db:seed
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Same format as app/lib/password.ts
function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

const people = [
    { first_name: "Super", name: "Admin", pseudo: "admin", email: "admin@bubbles.dev", location: "Paris", cellphone_number: "0699999999", status: "active", role: "admin", password: "admin123" },
    { first_name: "Bob", name: "Martin", pseudo: "bobm", email: "bob.martin@example.com", location: "Lyon", cellphone_number: "0611223344", status: "active", role: "recruiter", password: "password" },
    { first_name: "Chloé", name: "Leroy", pseudo: "chloel", email: "chloe.leroy@example.com", location: "Nantes", cellphone_number: "0633445566", status: "active", role: "recruiter", password: "password" },
    { first_name: "Alice", name: "Dupont", pseudo: "aliced", email: "alice.dupont@example.com", location: "Paris", cellphone_number: "0601020304", status: "candidate", role: "candidate", password: "password" },
    { first_name: "Charlie", name: "Bernard", pseudo: "charlieb", email: "charlie.bernard@example.com", location: "Marseille", cellphone_number: "0622334455", status: "active", role: "meeter", password: "password" },
    { first_name: "Inès", name: "Moreau", pseudo: "inesm", email: "ines.moreau@example.com", location: "Bordeaux", cellphone_number: "0644556677", status: "candidate", role: "candidate", password: "password" },
];

const companies = [
    { owner: 1, name: "Tech Corp", description: "Web and software development studio building products for startups and large accounts." },
    { owner: 1, name: "Green Solution", description: "Start-up focused on sustainable development and energy efficiency." },
    { owner: 2, name: "Nebula Games", description: "Independent video game studio crafting cosy multiplayer games." },
    { owner: 2, name: "Hexa Bank", description: "Digital bank rethinking everyday banking for students and freelancers." },
];

// [company index, title, location, contract, remote, category, salary, working time, description]
const ads = [
    [0, "Fullstack Developer Node.js / React", "Paris", "CDI", "Hybrid", "Engineering", "45k–55k € / year", "Full-time · 35h", "Join our product team to build and ship features end to end on a modern TypeScript stack. You will design APIs in Node.js, craft React interfaces, and take part in code reviews and architecture decisions."],
    [0, "DevOps Engineer", "Paris", "CDI", "Full-Remote", "Infrastructure", "50k–60k € / year", "Full-time · 35h", "Own our cloud infrastructure: Docker, Kubernetes, CI/CD pipelines and observability. You will automate everything that can be automated and help developers ship safely several times a day."],
    [0, "Frontend Developer Intern", "Paris", "Internship", "Hybrid", "Engineering", "1 200 € / month", "Full-time · 6 months", "Work alongside senior developers on our design system and customer-facing apps. Ideal for a student who loves pixel-perfect UIs, accessibility and component libraries."],
    [0, "QA Automation Engineer", "Lille", "CDD", "Hybrid", "Engineering", "40k € / year", "Full-time · 12 months", "Write and maintain end-to-end test suites with Playwright, improve our test strategy and help catch regressions before they reach production."],
    [0, "Technical Writer", "Remote", "Freelance", "Full-Remote", "Product", "400 € / day", "Part-time · 3 days/week", "Document our public APIs and SDKs. You will turn complex technical topics into clear guides and tutorials for developers."],
    [1, "GreenTech Project Manager", "Lyon", "CDD", "On-site", "Management", "42k € / year", "Full-time · 18 months", "Lead projects with environmental impact from scoping to delivery: coordinate engineers, partners and local authorities while tracking budget and carbon metrics."],
    [1, "Data Analyst – Energy", "Lyon", "CDI", "Hybrid", "Data", "40k–48k € / year", "Full-time · 35h", "Analyse energy consumption data from thousands of buildings, build dashboards and help our clients reduce their footprint."],
    [1, "Sustainability Consultant Apprentice", "Lyon", "Apprenticeship", "On-site", "Consulting", "Legal apprenticeship salary", "3 weeks company / 1 week school", "Support our consultants on carbon audits and sustainability strategies for SMEs while completing your degree."],
    [1, "Embedded Developer (IoT sensors)", "Grenoble", "CDI", "On-site", "Engineering", "45k–52k € / year", "Full-time · 35h", "Develop firmware in C for our low-power sensors, from prototyping to production, and work closely with the hardware team."],
    [1, "Marketing Intern", "Lyon", "Internship", "Hybrid", "Marketing", "1 000 € / month", "Full-time · 4 months", "Help us grow our community: content creation, newsletter, social media and event organisation."],
    [2, "Gameplay Programmer (Unity)", "Montpellier", "CDI", "Hybrid", "Engineering", "42k–50k € / year", "Full-time · 35h", "Implement gameplay mechanics, tools and UI in Unity/C# for our next cosy multiplayer title, in close collaboration with game designers."],
    [2, "2D Artist", "Montpellier", "Freelance", "Full-Remote", "Design", "350 € / day", "Missions of 2–3 months", "Create characters, props and environments in our hand-drawn art style."],
    [2, "Community Manager", "Montpellier", "CDD", "Hybrid", "Marketing", "32k € / year", "Full-time · 12 months", "Animate our Discord and social networks, gather player feedback and organise online events around our games."],
    [2, "Backend Developer – Multiplayer", "Remote", "CDI", "Full-Remote", "Engineering", "50k–58k € / year", "Full-time · 35h", "Build and scale the matchmaking and game servers behind our multiplayer games using Go and Redis."],
    [2, "Game Design Intern", "Montpellier", "Internship", "On-site", "Design", "1 100 € / month", "Full-time · 6 months", "Prototype mechanics, balance systems and write design documents with our lead designer."],
    [3, "Mobile Developer (React Native)", "Paris", "CDI", "Hybrid", "Engineering", "50k–60k € / year", "Full-time · 35h", "Ship features to hundreds of thousands of users on iOS and Android with React Native and TypeScript."],
    [3, "Security Engineer", "Paris", "CDI", "Hybrid", "Security", "60k–70k € / year", "Full-time · 35h", "Protect our customers' money: threat modelling, pentests, security reviews and incident response."],
    [3, "Customer Support Specialist", "Bordeaux", "CDI", "On-site", "Support", "30k € / year", "Full-time · 35h", "Help our customers by chat and phone, and turn their feedback into improvements with the product team."],
    [3, "Data Engineer Apprentice", "Paris", "Apprenticeship", "Hybrid", "Data", "Legal apprenticeship salary", "Alternating 2 years", "Build data pipelines with Python and SQL while completing your master's degree."],
    [3, "Product Designer", "Paris", "CDI", "Hybrid", "Design", "48k–55k € / year", "Full-time · 35h", "Design simple and delightful banking experiences, from user research to high-fidelity prototypes in Figma."],
    [3, "Backend Developer Intern (Java)", "Paris", "Internship", "Hybrid", "Engineering", "1 300 € / month", "Full-time · 6 months", "Contribute to our payment microservices in Java/Spring and learn how a regulated fintech ships software."],
    [0, "Scrum Master", "Paris", "CDI", "Hybrid", "Management", "50k € / year", "Full-time · 35h", "Coach two product teams on agile practices, facilitate ceremonies and remove impediments."],
];

async function main() {
    // Children first, then parents
    await prisma.messages.deleteMany();
    await prisma.event_participants.deleteMany();
    await prisma.events.deleteMany();
    await prisma.applications.deleteMany();
    await prisma.advertisements.deleteMany();
    await prisma.company.deleteMany();
    await prisma.people.deleteMany();

    const personIds = [];
    for (const { password, ...person } of people) {
        const created = await prisma.people.create({ data: { ...person, password_hash: hashPassword(password) } });
        personIds.push(created.person_id);
    }

    const companyIds = [];
    for (const { owner, ...company } of companies) {
        const created = await prisma.company.create({ data: { ...company, person_id: personIds[owner] } });
        companyIds.push(created.id_company);
    }

    const adIds = [];
    for (const [i, [company, title, location, contract_type, remote_status, category, salary, working_time, description]] of ads.entries()) {
        const created = await prisma.advertisements.create({
            data: {
                company_id: companyIds[company], title, location, contract_type, remote_status, category, salary, working_time, description,
                created_at: new Date(Date.now() - i * 36 * 3600 * 1000),
            },
        });
        adIds.push(created.advertisement_id);
    }

    const applications = [
        [3, 0, "Hello, I am very interested in this Fullstack position and would love to discuss it!"],
        [3, 15, "Mobile development is my passion, I have shipped two React Native apps."],
        [5, 6, "I just finished my master's in data science and would love to join Green Solution."],
        [5, 2, "Hi! I'm looking for a 6-month frontend internship starting in February."],
    ];
    for (const [person, ad, message] of applications) {
        const application = await prisma.applications.create({
            data: { person_id: personIds[person], advertisement_id: adIds[ad], message },
            include: { advertisements: { include: { company: true } } },
        });
        await prisma.messages.create({
            data: {
                sender_id: personIds[person],
                receiver_id: application.advertisements.company.person_id,
                application_id: application.application_id,
                content: message,
            },
        });
    }

    const event = await prisma.events.create({
        data: {
            title: "Job Fair Tech 2026",
            description: "Meet the best recruiters of the tech industry.",
            event_date: new Date("2026-11-15T10:00:00"),
            location: "Paris Expo",
            company_id: companyIds[0],
            organizer_id: personIds[4],
        },
    });
    await prisma.event_participants.createMany({
        data: [{ event_id: event.event_id, person_id: personIds[3] }, { event_id: event.event_id, person_id: personIds[1] }],
    });

    console.log(`Seeded ${people.length} people, ${companies.length} companies, ${ads.length} ads, ${applications.length} applications.`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
