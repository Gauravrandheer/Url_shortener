
# Changelog

All notable changes to this project will be documented in this file.

## [0.7.0] - 2025-04-07

### Added
- Added in memory cache to /redirect endpoint to improve response time.


## [0.6.0] - 2025-03-16 

### Added
- Added log middleware.
- Added valdiapi middleware.
- Added enterpriseMiddleware middleware.
- Added userblacklisted middleware.
- Added responsetime and requesttime middleware.
- Added sentery middleware

### Updated
- Updated All API for valdiapi middleware.
- Updated test case for the validapi middleware.
- Updated shortenbulk api for enterpriseMiddleware middleware.
- Updated test cases for user/url API for userblacklisted middleware.
- Updated test cases for health API for responsetime and requesttime middleware.


## [0.5.0] - 2025-03-10 

### Added
- Added teir column to the database.
- Added teir functionality to shortbulk api.
- Added edit API.
- Added test case for edit api.
- Added password functionality to the redirect API.
- Added new api user/urls.
- Added test case for api user/urls.
- Added new health api.
- Added test cases for health API.

### Updated
- Updated test case for the shortbulk API.
- Updated test case for the redirect API.
- Updated shorten and edit api for password functionality.
- Updated test cases for shorten and edi API.
- Updated Readme.


## [0.4.0] - 2025-03-07 

### Added
- Added new user table to the database.
- Added custom code functionality to shorten api.
- Added new case for custom code.
- Added new column expired_at to the database.
- Added test case for the expired_at.
- Added shortbulk api.
- Added test cases for the shortbulk.
- Added API key for user Authentication.

### Changed
- Change hard delete to soft delete and change delete api.

### Updated
- Update All API for the authentication as well as for expired_at.
- Updated test cases for the same.
- Updated Readme.

## [0.3.0] - 2025-02-20 

### Added
- Added new columns visit count and last_accessed_at to database.

### Changed
- Change one url have one shortcode to one url can have multiple shortcode.

### Updated
- Updated test cases for multiple shortcode for the same url.
- Updated Readme.


## [0.2.0] - 2025-02-10 

### Added
- Added delete api.
- Added test cases for delete api.
- Added new test case for redirect to check if shortcode not exist.
- Added our database to neon.

### Changed
- Change Sqlite database to Prisma.

### Updated
- Updated Readme.

### Fixed
- Resolved a minor bug for handle duplicate url.
- Resolved a edge case for delete api.


## [0.1.0] - 2025-02-05 

### Added
- Set up Basic express project.
- Added shorten and redirect api.
- Added test cases for shorten and redirect api.
- Added sqlite datebase to the project.
- Added Readme to the project.

### Updated
- Enhanced the test case after we introduced database to our project.

### Fixed
- Resolved a minor bug for Readme.