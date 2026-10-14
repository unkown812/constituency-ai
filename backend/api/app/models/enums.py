from enum import Enum

class ComplaintStatus(str, Enum):
    submitted = "submitted"
    under_review = "under_review"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    rejected = "rejected"

class ComplaintCategory(str, Enum):
    roads = "roads"
    sanitation = "sanitation"
    water = "water"
    electricity = "electricity"
    public_safety = "public_safety"
    health = "health"
    education = "education"
    other = "other"

class UserRole(str, Enum):
    citizen = "citizen"
    admin = "admin"
    officer = "officer"
    supervisor = "supervisor"
    mp = "mp"
