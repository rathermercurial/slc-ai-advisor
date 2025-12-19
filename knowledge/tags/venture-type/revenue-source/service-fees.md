---
title: Service Fees Tag Definition
last_updated: 2025-06-30
source:
tags: [design, admin]
---

# service-fees

## Definition
The `service-fees` tag identifies ventures that generate revenue through providing services to customers, including B2C and B2B models, time-based billing, SaaS subscriptions, and consulting services.

## Usage Criteria
Apply this tag to ventures that:
- Provide professional or personal services
- Operate Software-as-a-Service (SaaS) models
- Offer consulting, advisory, or expertise-based services
- Charge for time-based or project-based work
- Generate revenue from service delivery rather than product sales

## Always Include When
- Professional service providers (legal, accounting, consulting)
- Healthcare and wellness service providers
- Educational and training service providers
- Technology and software service companies
- Social services with fee-for-service models
- B2B service providers

## Never Include When
- Product-based revenue (use `product-sales` instead)
- Membership organizations (use `membership-dues` instead)
- Platform commission models (use `platform-commission` instead)
- Government contracts (use `gov-contract` instead)

## Required Combinations
- Must include `venture-type` and `revenue-source`
- Often combined with service-focused industry tags
- May combine with professional or technical impact mechanisms

## Content Examples
- Healthcare clinics and medical services
- Educational tutoring and training services
- Software-as-a-Service platforms
- Professional consulting for social enterprises
- Capacity building and organizational development services
- Technology services for nonprofits

## Related Tags
- Parent tags: `venture-type`, `revenue-source`
- Industry alignment: `healthcare`, `education`, `ict`, `financial-services`
- Impact mechanisms: `direct-service`, `capacity-building`
- Often paired with: `grant`, `impact-equity`

## Service Types
- **Professional Services**: Expertise-based consulting and advisory
- **Personal Services**: Direct services to individuals
- **Technology Services**: Software and digital platform services
- **Social Services**: Human services with social mission
- **B2B Services**: Business-to-business service offerings

## Revenue Characteristics
- Recurring or project-based revenue
- Service delivery scalability considerations
- Human capital intensive models
- Professional expertise requirements
- Client relationship management focus
- Potential for recurring customer relationships
