from __future__ import annotations
from dataclasses import dataclass, field, asdict
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Protocol, Callable
import uuid
import time

# -----------------------------
# Domain Model
# -----------------------------
class FormStatus(Enum):
    DRAFT = auto()
    SUBMITTED = auto()
    VALIDATED = auto()
    IN_REVIEW = auto()
    APPROVED = auto()
    REJECTED = auto()
    APPLIED = auto()
    ARCHIVED = auto()

@dataclass
class Form:
    id: str
    type: str
    requester_id: str
    payload: Dict[str, Any]
    status: FormStatus = FormStatus.DRAFT
    history: List[str] = field(default_factory=list)

@dataclass
class Decision:
    approved: bool
    comments: Optional[str] = None

@dataclass
class Event:
    name: str
    data: Dict[str, Any]
    ts: float = field(default_factory=time.time)

# -----------------------------
# Light Message Bus
# -----------------------------
class MessageBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Event], None]]] = {}

    def subscribe(self, topic: str, handler: Callable[[Event], None]) -> None:
        self._subscribers.setdefault(topic, []).append(handler)

    def publish(self, topic: str, event: Event) -> None:
        for handler in self._subscribers.get(topic, []):
            handler(event)

# -----------------------------
# Repositories (in-memory)
# -----------------------------
class FormRepo:
    def __init__(self):
        self._forms: Dict[str, Form] = {}

    def save(self, form: Form) -> None:
        self._forms[form.id] = form

    def get(self, form_id: str) -> Optional[Form]:
        return self._forms.get(form_id)

class AuditRepo:
    def __init__(self):
        self._events: List[Event] = []

    def record(self, event: Event) -> None:
        self._events.append(event)

    def all(self) -> List[Event]:
        return list(self._events)

# -----------------------------
# Agent Protocol + Registry
# -----------------------------
class Agent(Protocol):
    name: str
    def handle(self, event: Event) -> None: ...

class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, Agent] = {}

    def register(self, agent: Agent) -> None:
        self._agents[agent.name] = agent

    def get(self, name: str) -> Agent:
        return self._agents[name]

# -----------------------------
# Agents (minimal behavior)
# -----------------------------
class FormGeneratorAgent:
    def __init__(self, bus: MessageBus, forms: FormRepo):
        self.name = "FormGenerator"
        self.bus, self.forms = bus, forms
        self.bus.subscribe("request.form.create", self.handle)

    def handle(self, event: Event) -> None:
        req = event.data
        form = Form(
            id=str(uuid.uuid4()),
            type=req["form_type"],
            requester_id=req["requester_id"],
            payload={"fields": req.get("fields", {})},
            status=FormStatus.DRAFT,
            history=["created"],
        )
        self.forms.save(form)
        self.bus.publish("form.created", Event("form.created", {"form_id": form.id}))

class SubmissionAgent:
    def __init__(self, bus: MessageBus, forms: FormRepo):
        self.name = "Submission"
        self.bus, self.forms = bus, forms
        self.bus.subscribe("request.form.submit", self.handle)

    def handle(self, event: Event) -> None:
        form = self.forms.get(event.data["form_id"])
        if not form:
            return
        form.status = FormStatus.SUBMITTED
        form.history.append("submitted")
        self.forms.save(form)
        self.bus.publish("form.submitted", Event("form.submitted", {"form_id": form.id}))

class ValidationAgent:
    def __init__(self, bus: MessageBus, forms: FormRepo):
        self.name = "Validation"
        self.bus, self.forms = bus, forms
        self.bus.subscribe("form.submitted", self.handle)

    def handle(self, event: Event) -> None:
        form = self.forms.get(event.data["form_id"])
        if not form:
            return
        # Bare-bones rule: all fields must be non-empty
        fields = form.payload.get("fields", {})
        if all(v not in ("", None) for v in fields.values()):
            form.status = FormStatus.VALIDATED
            form.history.append("validated")
            self.forms.save(form)
            self.bus.publish("form.validated", Event("form.validated", {"form_id": form.id}))
        else:
            # Return to requester in a real system; here we just log reject
            form.status = FormStatus.REJECTED
            form.history.append("validation_failed")
            self.forms.save(form)
            self.bus.publish("form.validation_failed", Event("form.validation_failed", {"form_id": form.id}))

class WorkflowRouterAgent:
    def __init__(self, bus: MessageBus, forms: FormRepo):
        self.name = "WorkflowRouter"
        self.bus, self.forms = bus, forms
        self.bus.subscribe("form.validated", self.handle)

    def handle(self, event: Event) -> None:
        form = self.forms.get(event.data["form_id"])
        if not form:
            return
        form.status = FormStatus.IN_REVIEW
        form.history.append("routed_to_reviewer")
        self.forms.save(form)
        # Choose a reviewer (stub)
        self.bus.publish("review.requested", Event("review.requested", {"form_id": form.id, "assignee": "ReviewerA"}))

class ReviewerAgent:
    def __init__(self, bus: MessageBus, forms: FormRepo, approve_all: bool = True):
        self.name = "Reviewer"
        self.bus, self.forms, self.approve_all = bus, forms, approve_all
        self.bus.subscribe("review.requested", self.handle)

    def handle(self, event: Event) -> None:
        form = self.forms.get(event.data["form_id"])
        if not form:
            return
        decision = Decision(approved=self.approve_all, comments="OK" if self.approve_all else "Needs changes")
        form.status = FormStatus.APPROVED if decision.approved else FormStatus.REJECTED
        form.history.append(f"reviewed:{'approved' if decision.approved else 'rejected'}")
        self.forms.save(form)
        self.bus.publish(
            "review.completed",
            Event("review.completed", {"form_id": form.id, "decision": decision.approved, "comments": decision.comments}),
        )

class IntegrationAgent:
    def __init__(self, bus: MessageBus, forms: FormRepo):
        self.name = "Integration"
        self.bus, self.forms = bus, forms
        self.bus.subscribe("review.completed", self.handle)

    def handle(self, event: Event) -> None:
        form = self.forms.get(event.data["form_id"])
        if not form:
            return
        if form.status == FormStatus.APPROVED:
            # Simulate applying the outcome to an external system
            form.status = FormStatus.APPLIED
            form.history.append("applied_to_external")
            self.forms.save(form)
            self.bus.publish("integration.applied", Event("integration.applied", {"form_id": form.id}))
        else:
            self.bus.publish("integration.skipped", Event("integration.skipped", {"form_id": form.id}))

class NotificationAgent:
    def __init__(self, bus: MessageBus):
        self.name = "Notification"
        self.bus = bus
        for topic in [
            "form.created",
            "form.submitted",
            "form.validated",
            "form.validation_failed",
            "review.requested",
            "review.completed",
            "integration.applied",
            "integration.skipped",
            "archive.stored",
        ]:
            self.bus.subscribe(topic, self.handle)

    def handle(self, event: Event) -> None:
        # Minimal: print notifications
        print(f"[NOTIFY] {event.name}: {event.data}")

class ArchiveAgent:
    def __init__(self, bus: MessageBus, forms: FormRepo, audit: AuditRepo):
        self.name = "Archive"
        self.bus, self.forms, self.audit = bus, forms, audit
        self.bus.subscribe("integration.applied", self.handle)

    def handle(self, event: Event) -> None:
        form = self.forms.get(event.data["form_id"])
        if not form:
            return
        form.status = FormStatus.ARCHIVED
        form.history.append("archived")
        self.forms.save(form)
        self.audit.record(Event("archived", {"form_id": form.id, "snapshot": asdict(form)}))
        self.bus.publish("archive.stored", Event("archive.stored", {"form_id": form.id}))

class AnalyticsAgent:
    def __init__(self, bus: MessageBus, audit: AuditRepo):
        self.name = "Analytics"
        self.bus, self.audit = bus, audit
        self.bus.subscribe("archive.stored", self.handle)

    def handle(self, event: Event) -> None:
        # Minimal analytics: count archived forms
        archived = [e for e in self.audit.all() if e.name == "archived"]
        print(f"[ANALYTICS] archived_count={len(archived)}")

# -----------------------------
# Bootstrap / Demo
# -----------------------------
def main() -> None:
    bus = MessageBus()
    forms = FormRepo()
    audit = AuditRepo()

    # Register agents (instantiation wires subscriptions)
    FormGeneratorAgent(bus, forms)
    SubmissionAgent(bus, forms)
    ValidationAgent(bus, forms)
    WorkflowRouterAgent(bus, forms)
    ReviewerAgent(bus, forms, approve_all=True)
    IntegrationAgent(bus, forms)
    NotificationAgent(bus)
    ArchiveAgent(bus, forms, audit)
    AnalyticsAgent(bus, audit)

    # 1) Create a form
    bus.publish("request.form.create", Event("request.form.create", {
        "form_type": "GenericRequest",
        "requester_id": "user-123",
        "fields": {"reason": "Need access", "priority": "high"}
    }))

    # Grab the created form id (simplest way for demo)
    created_ids = [fid for fid, f in forms._forms.items() if f.status == FormStatus.DRAFT]
    form_id = created_ids[0]

    # 2) Submit it
    bus.publish("request.form.submit", Event("request.form.submit", {"form_id": form_id}))

    # Final snapshot
    final = forms.get(form_id)
    print("\n=== FINAL FORM STATE ===")
    print(final)
    print("History:", " -> ".join(final.history) if final else "N/A")

if __name__ == "__main__":
    main()

