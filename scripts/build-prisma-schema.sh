#!/bin/bash
cat \
  packages/database/prisma/base.prisma \
  packages/database/prisma/enums.prisma \
  packages/database/prisma/auth.prisma \
  packages/database/prisma/crm.prisma \
  packages/database/prisma/documents.prisma \
  packages/database/prisma/tasks.prisma \
  packages/database/prisma/billing.prisma \
  packages/database/prisma/notifications.prisma \
  packages/database/prisma/portal.prisma \
  packages/database/prisma/saas.prisma \
  packages/database/prisma/observability.prisma \
  > packages/database/prisma/schema.prisma

echo "Prisma schema generated successfully."
