# PagoPilot: Your Payment Pal

# PROJECT

Create a complete production-ready iOS application called "PagoPilot".

TAGLINE

Never forget a payment again.

PagoPilot is a smart payment organizer that automatically imports, scans, categorizes and reminds users about every bill, payment notice and payment document.

THIS IS NOT A PAYMENT APP.

Payments are completed using the official IO App or any banking app.

PagoPilot manages the entire payment lifecycle.

=================================================

TARGET USERS

People receiving:

• PagoPA

• Utility Bills

• Water Bills

• Electricity Bills

• Gas Bills

• Internet Bills

• Phone Bills

• Car Tax

• School Payments

• University Fees

• Medical Tickets

• Condo Fees

• Government Payments

• Insurance Payments

• Any PDF containing payment information

=================================================

TECH STACK

React Native

Expo SDK

Expo Router

TypeScript

Supabase

RevenueCat

NativeWind

React Query

React Hook Form

Vision Framework (iOS OCR)

PDFKit

Expo Notifications

Expo Secure Store

=================================================

APP GOAL

Allow users to import any payment document.

Automatically extract useful information.

Organize every payment.

Send reminders.

Store receipts.

Track payment history.

Generate statistics.

Everything inside one beautiful application.

=================================================

HOME

Dashboard cards

Payments Due

Expiring Soon

Paid

Overdue

Monthly Spending

Next Reminder

Quick Add Button

Import Button

Recent Documents

=================================================

IMPORT METHODS

Import PDF

Import Image

Take Picture

Share Extension

Files App

Mail Attachment

WhatsApp Share

Telegram Share

Google Drive

Dropbox

OneDrive

=================================================

AFTER IMPORT

Automatically

Read PDF

Perform OCR

Detect QR Code

Extract

Amount

Entity

Due Date

Notice Number

Tax Code

IBAN (if available)

Description

Category

Reference Number

If multiple payment notices exist

Display all detected documents.

=================================================

SUPPORTED DOCUMENTS

PagoPA

CBILL

MAV

RAV

Utility Bills

Invoices

Tax Documents

Insurance

School Payments

Medical Payments

Parking Fines

Government Notices

=================================================

PAYMENT OBJECT

Every payment contains

Title

Entity

Amount

Due Date

Category

Payment Status

Notice Number

Tax Code

IBAN

Description

Notes

Tags

Original PDF

Original Image

Receipt

Created Date

Updated Date

=================================================

PAYMENT STATUS

Pending

Due Today

Upcoming

Paid

Expired

Archived

Cancelled

=================================================

AUTOMATIC CATEGORIES

Home

Utilities

Government

Taxes

Education

Healthcare

Transport

Insurance

Shopping

Subscriptions

Business

Other

=================================================

SEARCH

Search everything

Title

Entity

Category

Notice Number

Amount

Notes

Tags

Date

=================================================

FILTERS

Pending

Paid

Expired

Current Month

This Year

Category

Amount Range

=================================================

DETAIL PAGE

Beautiful Apple style page

Display

Amount

Large Due Date

Category Icon

Original Document Preview

Buttons

Open PDF

View Image

Copy Notice Number

Share

Mark Paid

Archive

Delete

Attach Receipt

=================================================

RECEIPTS

Allow

Camera

Photos

PDF

Store every payment receipt.

=================================================

REMINDERS

Local Notifications

7 Days Before

3 Days Before

1 Day Before

Same Day

Custom Reminder

Repeat Daily Until Paid

=================================================

CALENDAR

Calendar View

Monthly

Weekly

Daily

Colored dots

Red = Overdue

Orange = Soon

Green = Paid

=================================================

STATISTICS

Monthly Spending

Yearly Spending

Payments by Category

Average Payment

Largest Payment

Most Frequent Entity

Monthly Trend

Pie Charts

Bar Charts

=================================================

DOCUMENT WALLET

Every imported document remains searchable.

No more searching inside Mail.

No more searching inside WhatsApp.

Everything stays inside PagoPilot.

=================================================

SMART OCR

Use Vision Framework.

Automatically detect

Amount

Date

Entity

Tax Code

Notice Number

IBAN

Payment Description

Confidence Score

If OCR confidence is low

Ask user confirmation.

=================================================

QR ENGINE

Detect QR

Inside PDFs

Inside Images

Inside Screenshots

Inside Photos

Display QR information.

Allow opening supported links.

=================================================

DATABASE

Supabase

TABLE users

id

email

premium

created_at

TABLE payments

id

user_id

title

entity

amount

due_date

status

category

notice_number

tax_code

iban

description

notes

tags

pdf_url

image_url

receipt_url

created_at

updated_at

TABLE reminders

id

payment_id

notification_date

enabled

TABLE categories

id

name

icon

color

=================================================

AUTHENTICATION

Apple Sign In

Email Login

Anonymous Guest Mode

=================================================

SETTINGS

Dark Mode

Light Mode

Notifications

Face ID

Touch ID

Export Database

CSV Export

Backup

Restore

Privacy Policy

Terms

About

=================================================

EXPORT

CSV

PDF Summary

JSON Backup

=================================================

PREMIUM

RevenueCat

FREE PLAN

Maximum 20 stored payments

Unlimited document scanning

Unlimited OCR

Unlimited QR Detection

Unlimited reminders

Ads enabled

No Cloud Backup

No Export

No Face ID

PREMIUM

Unlimited documents

Unlimited archive

Cloud Sync

CSV Export

PDF Export

Encrypted Backup

Face ID

Receipt Storage

Family Sharing (coming soon)

No Ads

Priority Support

=================================================

PAYWALL

Apple Style

Headline

Never miss another payment.

Subtitle

Keep every payment organized.

Benefits

Unlimited Archive

Cloud Sync

Receipt Storage

Face ID

PDF Export

No Ads

Pricing

€0.99/month

€9.99/year

14-day free trial

Buttons

Continue

Restore Purchases

Maybe Later

=================================================

DESIGN

Apple Human Interface Guidelines

Large Titles

Rounded Cards

Smooth Animations

Blur Effects

Glassmorphism

Dark Mode

Bottom Navigation

Tabs

Home

Documents

Calendar

Statistics

Settings

=================================================

COLORS

Primary

#0A84FF

Green

#34C759

Orange

#FF9500

Red

#FF3B30

Gray

#8E8E93

Background

#F5F5F7

=================================================

SERVICES

OCRService

QRScannerService

DocumentParser

ReminderService

SupabaseService

RevenueCatService

StorageService

AuthenticationService

NotificationService

ExportService

AnalyticsService

=================================================

FOLDER STRUCTURE

/app

/components

/features

/screens

/hooks

/context

/services

/database

/supabase

/assets

/types

/utils

/constants

=================================================

CODE REQUIREMENTS

Production Ready

Clean Architecture

Strong TypeScript

Reusable Components

Responsive UI

Offline Support

Accessibility

Loading States

Error Handling

Unit-Test Ready

Performance Optimized

Well Commented

=================================================

FUTURE FEATURES

AI Document Classification

AI Expense Insights

Automatic Duplicate Detection

Shared Family Wallet

iCloud Sync

Apple Watch App

Widgets

Siri Shortcuts

Apple Intelligence Integration

=================================================

FINAL OBJECTIVE

Generate the entire project.

Generate every screen.

Generate every component.

Generate navigation.

Generate Supabase schema.

Generate SQL.

Generate authentication.

Generate RevenueCat integration.

Generate OCR parser.

Generate QR parser.

Generate local notifications.

Generate beautiful Apple UI.

Generate production-ready code.

The project must compile immediately in Expo without placeholders or mock implementations where feasible.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/199c9178-4400-4299-a54d-5e5a25038b7b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
