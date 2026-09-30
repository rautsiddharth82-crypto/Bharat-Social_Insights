from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from services.audit_service import log_audit_event
import logging

logger = logging.getLogger("bsi.api.middleware")

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        
        # Log all analyst-facing GET/POST data endpoints
        if path.startswith(("/sentiment", "/trends", "/demographics", "/network", "/rumor-risk", "/alerts", "/admin")):
            user_id = request.headers.get("X-Analyst-ID", "analyst_guest")
            query_params = dict(request.query_params)
            try:
                log_audit_event(user_id, path, query_params)
            except Exception as e:
                logger.error(f"Failed to log audit event: {e}")

        return response
