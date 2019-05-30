# CONTRIBUTING

First of all we thank you for your effort and contribution!

## Contribution Prerequisites
* Node version 8.16.0 or greater must be installed.
* Familiarity with Git and the Git workflow. 

## Found a Bug?
If you've found a bug in the source code, you can help us by 
[submitting an issue](https://github.com/Ontotext-AD/graphdb.js/issues/new?template=bug_report.md)
using our predefined template. We value our and your time, so before you submit 
an issue, please check the issue tracker if similar bug is not already reported
or already fixed in newer library versions.

## Proposing a Change or a Feature
If you plan to change the public API of the library, or make a major refactoring, 
our recommendation is to [create an issue](https://github.com/Ontotext-AD/graphdb.js/issues/new?template=feature_request.md)
first. This will allow us to reach an agreement on the proposal before you put
significant effort in it.

## Submitting a Pull Request
* Fork the repository and create a new branch from master.
* In the project root execute `npm install`.
* If you've fixed a bug or introduced new code then add appropriate test cases
to prove everything is working as expected.
* Run the test suite and be sure all tests pass `npm run test`.
* Check the code style by `npm run lint`.
* Make sure that documentation is properly updated according to changes in the 
code. Bear in mind that we use [JSDoc](https://jsdoc.app/) to generate the 
library's documentation and JSDoc tags to add additional information like types, 
methods visibility and more in order to make development process smoother and 
also to help the IDE's with the static type checking. So we will appreciate if 
you contribute to the documentation with care.
* Commit the code and properly describe your changes in the commit message.
Keep the title short and follow it with a blank line. A good description of a
change contains most importantly the reason for it and not the implementation
details.
* Push the branch.
* Send a pull request to `master` in GitHub.
* Our team is monitoring for pull requests and will review and eventually 
suggest changes for the code, tests or documentation:
  * Discuss the proposed changes or implement them.
  * Update test cases and documentation if necessary and execute the test suite 
  again.
  * Rebase the branch.
  * Push with force to your repository.
* The pull request gets approved and merged, delete the branch and pull your 
master to get the latest changes.

## Coding Rules
The rules we follow promotes clean, well documented and tested code which helps
development process to be smooth and makes the library very developer friendly. 
* We follow the [Google style guide](https://google.github.io/styleguide/jsguide.html)
and we enforce it by running the linting step when changes are pushed in the 
repository.
* All features and bug fixes are covered with 
[unit and component level tests](https://github.com/Ontotext-AD/graphdb.js/tree/master/test). 
* We maintain a complete acceptance test suite which is run against GraphDB with 
test data which guarantees the integration and the API contract is not broken. 
The acceptance suite is run regularly after merge in the repository.
* All public API methods are properly documented including JSDoc tags. 
Actual documentation can be found [here](https://ontotext-ad.github.io/graphdb.js/)
