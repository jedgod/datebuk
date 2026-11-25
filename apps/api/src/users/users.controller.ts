import { Controller, Get, Req, UseGuards, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { UsersService } from "./users.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

// Only fields that are actually safe/sensible to sort a public user listing by. A
// client-controlled `sort` value passed straight into Prisma's `orderBy` would let an
// arbitrary (and possibly invalid, causing a 500) or sensitive field name through.
const SORTABLE_FIELDS = new Set(["trustScore", "createdAt", "lastActiveAt"]);
const DEFAULT_SORT = "trustScore";

@Controller("users")
export class UsersController {
  constructor(private users: UsersService, private subscriptions: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    const [user, accessTier] = await Promise.all([
      this.users.me(req.user.userId),
      this.subscriptions.getAccessTier(req.user.userId),
    ]);
    return { ...user, accessTier };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listUsers(
    @Req() req: any,
    @Query('gender') gender?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('sort') sort: string = DEFAULT_SORT
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortField = SORTABLE_FIELDS.has(sort) ? sort : DEFAULT_SORT;
    return this.users.listUsers({
      skip,
      take: parseInt(limit),
      where: gender ? { gender: gender.toUpperCase() } : {},
      orderBy: { [sortField]: 'desc' },
      exclude: [req.user.userId], // Don't show current user
    });
  }
}
