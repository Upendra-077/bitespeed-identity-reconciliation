import { prisma } from "./prisma";

interface IdentifyInput {
  email?: string;
  phoneNumber?: string;
}

export async function identifyContact(input: IdentifyInput) {
  const email = input.email?.trim().toLowerCase();
  const phoneNumber = input.phoneNumber?.trim();

  if (!email && !phoneNumber) {
    throw new Error("Either email or phoneNumber must be provided");
  }

  return prisma.$transaction(async (tx) => {
    // Step 1: Find matching contacts
    const matchedContacts = await tx.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean) as any,
      },
    });

    // Case 1: No existing contact
    if (matchedContacts.length === 0) {
      const newContact = await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "primary",
        },
      });

      return formatResponse([newContact]);
    }

    // Step 2: Get all related contacts
    const contactIds = matchedContacts.map((c) =>
      c.linkPrecedence === "primary" ? c.id : c.linkedId!
    );

    const primaryContacts = await tx.contact.findMany({
      where: {
        id: { in: contactIds },
      },
      orderBy: { createdAt: "asc" },
    });

    const primary = primaryContacts[0];

    // Step 3: Convert other primaries to secondary if needed
    for (const pc of primaryContacts.slice(1)) {
      await tx.contact.update({
        where: { id: pc.id },
        data: {
          linkPrecedence: "secondary",
          linkedId: primary.id,
        },
      });
    }

    // Step 4: Create secondary if new info
    const emails = matchedContacts.map((c) => c.email);
    const phones = matchedContacts.map((c) => c.phoneNumber);

    if (
      (email && !emails.includes(email)) ||
      (phoneNumber && !phones.includes(phoneNumber))
    ) {
      await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "secondary",
          linkedId: primary.id,
        },
      });
    }

    // Step 5: Fetch all linked contacts
    const allContacts = await tx.contact.findMany({
      where: {
        OR: [{ id: primary.id }, { linkedId: primary.id }],
      },
    });

    return formatResponse(allContacts);
  });
}

function formatResponse(contacts: any[]) {
  const primary = contacts.find((c) => c.linkPrecedence === "primary");

  const uniqueEmails = Array.from(
    new Set(contacts.map((c) => c.email).filter(Boolean))
  );

  const uniquePhones = Array.from(
    new Set(contacts.map((c) => c.phoneNumber).filter(Boolean))
  );

  return {
    contact: {
      primaryContactId: primary.id,
      emails: [
        primary.email,
        ...uniqueEmails.filter((e) => e !== primary.email),
      ],
      phoneNumbers: [
        primary.phoneNumber,
        ...uniquePhones.filter((p) => p !== primary.phoneNumber),
      ],
      secondaryContactIds: contacts
        .filter((c) => c.linkPrecedence === "secondary")
        .map((c) => c.id),
    },
  };
}