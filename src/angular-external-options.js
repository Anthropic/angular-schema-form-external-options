angular.module('schemaForm').directive('externalOptions', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      form: '=',
      model: '='
    },
    controller:['$scope','$http','$interpolate','sfSelect', function($scope, $http, $interpolate, sfSelect){
      var i,
          scope = $scope
      ;
      scope.form.options = [];
      scope.currentSource = '';
      scope.externalOptions = {};

      var processOptions = function(optionSource, data, current) {
        scope.form.options = data.titleMap;

        if(scope.externalOptions[optionSource] !== data) {
          scope.externalOptions[optionSource] = data;
        };

        scope.$watch('form.selectedOption', function(newValue, oldValue) {
          sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
        });

        // determine if the new options contain the old one
        for(var i=0; i<scope.form.options.length; i++) {
          if(scope.form.options[i].value && current === scope.form.options[i].value) {
            scope.form.selectedOption = scope.form.options[i].value;
            return;
          }
        };

        scope.form.selectedOption = null;
        sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
        return;
      }

      var loadOptions = function(optionSource, newValue){
        if(scope.currentSource === optionSource && (typeof scope.externalOptions[optionSource] === 'object')) {
          return;
        }
        else {
          scope.currentSource = optionSource;
        };

        var current = sfSelect(scope.form.key, scope.model);

        if(typeof scope.externalOptions[optionSource] === 'object') {
          processOptions(optionSource, scope.externalOptions[optionSource], current);
          return;
        };

        $http.get(optionSource,{responseType:"json"})
          .success(function(data, status){
            processOptions(optionSource, data, current);
          })
          .error(function(data, status){
            scope.form.options = [];
            scope.form.selectedOption = null;
            sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
          });
      };
      if (scope.form.parameters.length) {
        for(var i=0; i<scope.form.parameters.length; i++) {
          if (angular.isDefined(scope.form.parameters[i])) {
            scope.$watch(scope.form.parameters[i][1], function(newValue, oldValue) {
              var exp, optionSource;
              if (newValue) {
                exp = $interpolate(scope.form.optionSource, false, null, true);
                optionSource = exp(scope);
                loadOptions(optionSource, scope.form.key);
              }
              else {
                scope.form.options = [];
              };
            });
          };
        };
      }
      else {
        loadOptions(scope.form.optionSource);
      };
    }]
  };
});