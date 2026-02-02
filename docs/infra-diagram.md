# Flowchart Diagram

Server AWS

## Server

### CloudFront

    aws service : CloudFront
    comment : Domain management, Cloud, Proxy, DDOS

### Front-end

    aws service : s3
    project type : NextJS
    next-build : SSG

### gateway

    aws service : EC2 (ECS)
    Project type : NestJS
    Concern : API Gateway Overload
    nest-build : microservice

### Elastic Load Balancing

    aws service : ELB
    comment : Load balancing, SSL termination, Proxy

### microservice

    - Microservice Authentication

        project type : NestJS
        protocol : TCP
        Port number : 5001
        nest-build : microservice

        OR

        Project type : Keyclock
        protocol : TCP
        Port number : 8080

    - Microservice Cluster

        project type : NestJS
        protocol : TCP
        Port number : 5002

    - microservice License
        project type : NestJS
        protocol : TCP
        Port number : 5003

    - Microservice File

        project type : NestJS
        protocol : TCP
        Port number : 5004

    - Microservice Notification

        project type : NestJS
        protocol : TCP
        Port number : 5005

    - Microservice Report

        project type : NestJS
        protocol : TCP
        Port number : 5007

    - Microservice Tenant Master
        project type : NestJS
        protocol : TCP
        Port number : 5008
        nest-build : microservice
        
    - Microservice Tenant Procurement
        project type : NestJS
        protocol : TCP
        Port number : 5009
        nest-build : microservice

    - Microservice Tenant Inventory
        project type : NestJS
        protocol : TCP
        Port number : 5010
        nest-build : microservice
        
    - Microservice Tenant Recipe
        project type : NestJS
        protocol : TCP
        Port number : 5011
        nest-build : microservice

### Database

    aws service : RDS OR Aurora
    project type : PostgreSQL
    Database : PostgreSQL
    schema : Multi-tenant (Schema)

```mermaid

flowchart TD

    FrontEnd["Front-end\n(Next.JS)\nDocker Port: 3500\nEC2: small size"]
    FrontEndAPI["Front-end\n(Next.JS)\nAPI"]
    BackEnd["Back-end\nAPI Gateway\nDocker Port: 4000"]
    VendorPortal["Vendor Portal\n(Next.JS)"]
    ExchangeRate["Exchange\nRateService\n(Bank Rate)"]
    Redis[(Redis)]
    PostgreSQL[(PostgreSQL\nEC2 ?? RDS\nAurora)]
    S3Storage[(S3 Storage\nAWS)]
    FileService["File Service"]
    ClusterService["Cluster Service\nBusiness Unit Service\nUser Service\nLicense Service\nIncident Service\n..."]
    TenantService["Tenant service\n• Purchase Request\n• Purchase Order\n• Good received note\n• ...\n• config ..."]
    ReportService["Reports Service\n(Fast Report ??\nReact PDF)"]
    IdentityService["Identity Service\n(OAuth ?? Supabase)\naws : cognito\nKEYCLOAK"]
    NotificationService["Notification Service"]
    MailService["Mail Service\n(Resend)"]
    ScheduleService["Schedule\n(Cron job)"]
    InterfaceService["Interface Service\n(Third party\nplatform)"]
    NoSQL[(NoSQL\nReports and AI)]
    Aurora["AURORA"]
    PostgreSQL1[(PostgreSQL)]
    PostgreSQL2[(PostgreSQL)]
    PostgreSQL3[(PostgreSQL)]

    FrontEnd <--> FrontEndAPI
    FrontEndAPI <--> BackEnd
    VendorPortal <--> BackEnd
    BackEnd <--> ExchangeRate
    BackEnd <--> Redis
    BackEnd --> NotificationService
    BackEnd --> MailService
    BackEnd --> ScheduleService
    BackEnd --> InterfaceService
    BackEnd <--> IdentityService
    BackEnd <--> ClusterService
    BackEnd <--> FileService
    BackEnd <--> TenantService
    BackEnd <--> ReportService
    IdentityService <--> PostgreSQL
    ClusterService <--> PostgreSQL
    FileService <--> S3Storage
    TenantService <--> Aurora
    ReportService <--> NoSQL
    ReportService <--> Aurora

    subgraph AuroraCluster["AURORA"]
        PostgreSQL1 <--> PostgreSQL2 <--> PostgreSQL3
    end

    TenantService <--> AuroraCluster
    ReportService <--> AuroraCluster
```
