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
          email: email ?? null,
          phoneNumber: phoneNumber ?? null,
          linkPrecedence: "primary",
        },
      });

      return formatResponse([newContact]);
    }

    // Find all related primary IDs
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
    if (!primary) {
      throw new Error("Primary contact not found");
    }

    // Convert other primaries to secondary
    for (const pc of primaryContacts.slice(1)) {
      await tx.contact.update({
        where: { id: pc.id },
        data: {
          linkPrecedence: "secondary",
          linkedId: primary.id,
        },
      });
    }

    const emails = matchedContacts.map((c) => c.email);
    const phones = matchedContacts.map((c) => c.phoneNumber);

    if (
      (email && !emails.includes(email)) ||
      (phoneNumber && !phones.includes(phoneNumber))
    ) {
      await tx.contact.create({
        data: {
          email: email ?? null,
          phoneNumber: phoneNumber ?? null,
          linkPrecedence: "secondary",
          linkedId: primary.id,
        },
      });
    }

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

  if (!primary) {
    throw new Error("Primary contact missing");
  }

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