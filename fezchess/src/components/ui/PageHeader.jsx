import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * PageHeader — Linear/Notion grade page header.
 *   <PageHeader
 *     title="Quản lý học viên"
 *     description="Danh sách & CRUD"
 *     breadcrumbs={[{label:"Admin", to:"/dashboard"}, {label:"Học viên"}]}
 *     actions={<Button>Tạo học viên</Button>}
 *     meta={<Badge>123 học viên</Badge>}
 *   />
 */
const PageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  className,
}) => {
  return (
    <header className={cn("space-y-3 md:space-y-4", className)}>
      {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
                  {idx > 0 ? (
                    <ChevronRight className="w-3 h-3 opacity-60" aria-hidden="true" />
                  ) : null}
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? "text-foreground font-medium" : ""}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {meta ? <div className="flex items-center gap-2">{meta}</div> : null}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
};

export { PageHeader };
export default PageHeader;
