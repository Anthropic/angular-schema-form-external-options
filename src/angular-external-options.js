angular.module('schemaForm').directive('externalOptions', function() {
  return {
    restrict: 'A',
    require: [ 'ngModel', '?^sfSchema' ],
    scope: {
      test: '=',
      form: '=',
      model: '='
    },
    controller:[ '$scope', '$http', '$interpolate', '$filter', 'sfSelect',
      function($scope, $http, $interpolate, $filter, sfSelect) {

        var i,
            scope = $scope;

        scope.form.options = [];
        scope.currentSource = '';
        scope.externalOptions = {};

        var processOptions = function(optionSource, data, current) {
          var enumTitleMap = [];

          if (data.enum && data.enum.length) {
            for (i = 0; i < data.enum.length; i++) {
              if (data.enum[i] && data.enum[i].length) {
                enumTitleMap.push({ name:data.enum[i], value:data.enum[i] });
              };
            };
            scope.form.options = enumTitleMap;
          }
          else if (data.titleMap) {
            scope.form.options = data.titleMap;
          };

          if (scope.externalOptions[optionSource] !== data) {
            scope.externalOptions[optionSource] = data;
          };

          scope.$watch('form.selectedOption', function(newValue, oldValue) {
            sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
          });

          // determine if the new options contain the old one
          for (var i = 0; i < scope.form.options.length; i++) {
            if (typeof scope.form.options[i].value !== 'undefined' && current === scope.form.options[i].value) {
              scope.form.selectedOption = scope.form.options[i].value;
              return;
            }
          };

          sfSelect(scope.form.key, scope.model, 'null');
          return;
        };

        var loadOptions = function(optionSource, newValue) {
          if (scope.currentSource === optionSource && (typeof scope.externalOptions[optionSource] === 'object')) {
            return;
          }
          else {
            scope.currentSource = optionSource;
          };

          var current = sfSelect(scope.form.key, scope.model);
          current = (current) ? current : undefined;

          optionSource = $filter('_externalOptionUri')(optionSource);

          if (typeof scope.externalOptions[optionSource] === 'object') {
            processOptions(optionSource, scope.externalOptions[optionSource], current);
            return;
          };

          $http.get(optionSource, { responseType: 'json' })
            .then(function(res, status) {
              processOptions(optionSource, res.data, current);
            }, function(res, status) {
              scope.form.options = [];
              scope.form.selectedOption = '';
              sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
            });
        };

        if (!!scope.form.optionData) {
          scope.$parent.evalExpr('this').$watchCollection(scope.form.optionData, function(newOptions, oldOptions) {
            var options = {};
            if (angular.isArray(newOptions)) {
              options = (angular.isString(newOptions[0])) ? { enum: newOptions } : { titleMap: newOptions };
            };
            processOptions('data:' + scope.form.optionData, options, scope.form.selectedOption);
          });
        }
        else if (scope.form.parameters && scope.form.parameters.length) {
          for (var i = 0; i < scope.form.parameters.length; i++) {
            if (angular.isDefined(scope.form.parameters[i])) {
              scope.$watch(scope.form.parameters[i][1], function(newValue, oldValue) {
                var newValue = $filter('_externalOptionUriField')(newValue),
                    exp,
                    optionSource;

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
      }
    ]
  };
})
.filter('_externalOptionUriField', [ '$injector', '$filter',
  function($injector, $filter) {
    var _externalOptionUriFieldFilter = function(input) {
      if ($injector.has('externalOptionUriFieldFilter')) {
        input = $filter('externalOptionUriField')(input);
      };
      return input;
    };

    return _externalOptionUriFieldFilter;
  }
])
.filter('_externalOptionUri', [ '$injector', '$filter',
  function($injector, $filter) {
    var _externalOptionUriFilter = function(input) {
      if ($injector.has('externalOptionUriFilter')) {
        input = $filter('externalOptionUri')(input);
      };
      return input;
    };

    return _externalOptionUriFilter;
  }
]);

/**
 * @license Uecomm v{{version}}
 * (c) 2014-{{year}} Singtel Optus. http://optus.com.au
 * License: MIT
 */
(function(angular, undefined) {'use strict';
  angular
    .module('schemaForm')
    .directive('destroyHiddenData', [ 'sfSelect', function(sfSelect) {
      return {
        link: function(scope, element, attrs) {
          var preserve = false;

          scope.$on('$destroy', function() {
            if (typeof scope.form.preserveOnDestroy === 'object' && scope.form.preserveOnDestroy.condition) {
              preserve = scope.evalExpr(scope.form.preserveOnDestroy.condition);
            }
            else if (!!scope.form.preserveOnDestroy) {
              preserve = true;
            };

            if (!preserve) {
              scope.form.selectedOption = '';
              sfSelect(scope.form.key, scope.model, scope.form.selectedOption);
            };
          });
        }
      };
    } ]);
})(window.angular);

/**
 * @license Uecomm v{{version}}
 * (c) 2014-{{year}} Singtel Optus. http://optus.com.au
 * License: MIT
 */
(function(angular, undefined) {'use strict';

  angular
    .module('schemaForm')
    .directive('oyInline', [ 'schemaForm', 'sfValidator', 'sfPath', 'sfSelect',
      function(schemaForm, sfValidator, sfPath, sfSelect) {
        return {
          restrict: 'A',
          require: 'ngModel',
          //scope: false,
          scope: {
            oyInline:'=',
            ngModel: '=',
            ngModelOptions: '=',
            model: '=',
            sfChanged: '=',
            schemaValidate: '='
          },
          link: function(scope, element, attrs, ngModel) {
            var useKey = sfPath.stringify(scope.schemaValidate.key),
                schema = {},
                title = scope.schemaValidate.title || scope.schemaValidate.key.join('.') || '';

            angular.copy(scope.schemaValidate.schema, schema);

            if (schema.properties && schema.anyOf) {
              scope.schemaValidate.schema.allowInvalid = true;
              delete schema.properties;
            };

            ngModel.$name = title;
            ngModel.$options.allowInvalid = true;

            scope.$watchCollection('model' + useKey, function(newVal, oldVal) {
              if (ngModel.$validate) {
                ngModel.$validate();
                if (ngModel.$invalid) { // The field must be made dirty so the error message is displayed
                  ngModel.$dirty = true;
                  ngModel.$pristine = false;
                }
              }
              else {
                ngModel.$setViewValue(ngModel.$viewValue);
              }
            });

            ngModel.$validators = {
              anyOf: function(modelValue, viewValue) {
                tv4.validate(scope.ngModel, schema);
                return tv4.valid;
              }
            };

            // Listen to an event so we can validate the input on request
            scope.$on('schemaFormValidate', function() {
              if (ngModel.$validate) {
                ngModel.$validate();
                if (ngModel.$invalid) { // The field must be made dirty so the error message is displayed
                  ngModel.$dirty = true;
                  ngModel.$pristine = false;
                }
              }
              else {
                ngModel.$setViewValue(ngModel.$viewValue);
              };
            });
          }
        };
      }
    ]);
})(window.angular);
