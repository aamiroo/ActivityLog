# ActivityLog

A local network-based activity logging system for managing and recording activities of multiple people from a centralized dashboard.

## Overview

**Activity Log** is a lightweight management system designed for situations where a single operator needs to record activities or events for multiple people.

The system runs on a local network, allowing the operator to manage people and record events from a centralized dashboard without requiring internet access.

## Features

* Manage multiple people
* Record activities with timestamps
* View recent activities
* View activity history for each person
* Search and filter activities
* Manage people from a central dashboard
* Local network deployment
* Single operator access
* Persistent database storage

## Example

An operator can select a person and record an activity:

```text
Person: Amir
Activity: Check-in
Time: 08:32:14
Date: 2026-10-05
```

The activity history can then be viewed as:

```text
Amir

08:32  Check-in
10:15  Leave
10:42  Return
13:20  Leave
14:05  Return
```

## Tech Stack

* Python
* HTML / CSS / JavaScript
* PostgreSQL
* Docker

## Deployment

The application is designed primarily for deployment on a local network.

The server runs on one machine and other devices on the same network can access the dashboard through the server's local IP address.

```text
http://0.0.0.0:8000
```

Internet access is not required for normal operation.

## Project Status

🚧 **In Development**

## Licens



