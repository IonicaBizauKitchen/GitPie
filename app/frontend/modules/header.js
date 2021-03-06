(function () {
  angular.module('header', [])

  .directive('pieHeader', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/frontend/view/header/pieHeader.html',

      controller: function ($scope, $element, CommomService) {
        var selectedRepository = null;

        this.remoteBranchs = [];
        this.syncStatus = {};
        this.loading = false;

        // Menu show hide controller vars
        this.showAddMenu = false;
        this.showBranchMenu = false;
        this.showSettingsMenu = false;

        this.toggleMenu = function (menuIndex) {

          switch (menuIndex) {
            case 1:
              this.showAddMenu = !this.showAddMenu;
              break;
            case 2:
              this.showBranchMenu = !this.showBranchMenu;
             break;
            case 3:
              this.showSettingsMenu = !this.showSettingsMenu;
             break;
          }
        };

        this.hideAllMenu = function () {
          this.showAddMenu = false;
          this.showBranchMenu = false;
          this.showSettingsMenu = false;
        };

        CommomService.hideHeaderMenu = this.hideAllMenu.bind(this);

        $scope.updateRepositoryPath = function (e) {
          $scope.repositoryPath = e.value;

          $scope.$apply();
        };

        $scope.$on('repositorychanged', function (event, repository) {
          this.loading = true;

          selectedRepository = repository;

          GIT.getCurrentBranch(repository.path, function (err, currentBranch, remoteBranchs) {
            this.currentBranch = currentBranch;
            this.remoteBranchs = remoteBranchs;

            $scope.$apply();
          }.bind(this));

          GIT.getStatus(repository.path, function (err, syncStatus, files) {
            this.syncStatus = syncStatus;
            this.loading = false;

            $scope.$broadcast('unsynChanges', files);

            $scope.$apply();
          }.bind(this));

        }.bind(this));

        this.switchBranch = function (branch, forceCreateIfNotExists) {

          GIT.switchBranch({
            path: selectedRepository.path,
            branch: branch,
            forceCreateIfNotExists: forceCreateIfNotExists
          }, function (err) {

            if (err) {
              alert('Error switching branch. Error:' + err);
            } else {
              this.currentBranch = branch;

              $scope.$broadcast('changedbranch', selectedRepository);

              this.hideAllMenu();

              $scope.$apply();
            }
          }.bind(this));
        };

        this.sync = function () {

          if (selectedRepository) {
            this.loading = true;

            GIT.fetch(selectedRepository.path, function (err) {

              // Ignored error for while to not block status for private repositories

              GIT.sync(selectedRepository.path, function (err) {

                if (err) {
                  alert('Error syncronazing repository. \n Error: ' + err.message);
                } else {
                  $scope.$broadcast('changedbranch', selectedRepository);
                }

                this.loading = false;
              });
            });
          }
        };

        this.addRepository = function (repositoryPath) {
          var repository = CommomService.addRepository(repositoryPath);

          if (repository) {
            $scope.$broadcast('changedbranch', repository);
            CommomService.hideHeaderMenu();
          }
        };

        this.checkoutBranch = function ($event, newBranch) {

          if ($event.keyIdentifier == 'Enter') {
            var newBranchName = this.treatBranch(newBranch),
              forceCreateIfNotExists = !this.branchExists(newBranchName);

            this.switchBranch(newBranchName, forceCreateIfNotExists);
          }
        };

        this.branchExists = function (branchName) {
          var treatedBranchName = this.treatBranch(branchName);

          for (var i = 0; i < this.remoteBranchs.length; i++) {

            if (this.remoteBranchs[i].trim() == treatedBranchName) {
              return true;
            }
          }

          return false;
        };

        this.treatBranch = function (branchName) {
          return branchName && branchName.replace(/ /g, '-');
        };
      },

      controllerAs: 'headerCtrl'
    };
  });
})();
