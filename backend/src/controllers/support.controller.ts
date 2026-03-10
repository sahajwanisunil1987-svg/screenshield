import { Prisma, SupportTicketKind, SupportTicketStatus } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { getSingleParam } from "../utils/helpers.js";
import { sendSupportTicketAcknowledgement } from "../services/notification.service.js";

export const createSupportTicket = async (req: Request, res: Response) => {
  const payload = req.body;
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user?.userId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      subject: payload.subject,
      message: payload.message,
      orderNumber: payload.orderNumber || null,
      kind: payload.kind
    }
  });

  await sendSupportTicketAcknowledgement(payload.email, ticket.id).catch(() => null);

  res.status(StatusCodes.CREATED).json(ticket);
};

export const adminSupportTickets = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 12);
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "ALL");
  const kind = String(req.query.kind ?? "ALL");

  const where: Prisma.SupportTicketWhereInput = {
    ...(status !== "ALL" ? { status: status as SupportTicketStatus } : {}),
    ...(kind !== "ALL" ? { kind: kind as SupportTicketKind } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
            { orderNumber: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportTicket.count({ where })
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};

export const updateSupportTicket = async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id)!;
  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: req.body.status,
      adminNotes: req.body.adminNotes || null,
      ...(req.body.status === "RESOLVED" ? { resolvedAt: new Date() } : { resolvedAt: null })
    }
  });

  res.json(ticket);
};
