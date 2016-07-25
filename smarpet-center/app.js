// script.js

var app = angular.module('app', ['ui.router', 'highcharts-ng']);
var URL = "http://127.0.0.1:3000/smarpet/center";
app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/patients");

    $stateProvider
        .state("patients", {
            url: "/patients",
            views: {
                'list': {
                    templateUrl: 'partials/patient/_patientList.html',
                    controller: 'PatientsController'
                }
            }
        })
        .state("patients.details", {
            url: "/:id",
            views: {
                'detail': {
                    templateUrl: "partials/patient/_patientDetails.html",
                    controller: "PatientsDetailsController"
                }
            }
        })
        .state("emergencies", {
            url: "/emergencies",
            views: {
                'list': {
                    templateUrl: 'partials/emergency/_emergencyList.html',
                    controller: 'EmergenciesController'
                }
            }
        })
        .state("emergencies.details", {
            url: "/:id",
            views: {
                'detail': {
                    templateUrl: "partials/emergency/_emergencyDetails.html",
                    controller: "EmergenciesDetailsController"
                }
            }
        });
});

angular
    .module('app')
    .controller('NavigationController', NavigationCtrl)
    .controller('PatientsController', PatientsCtrl)
    .controller('PatientsDetailsController', PatientsDetailsCtrl)
    .controller('EmergenciesController', EmergenciesCtrl)
    .controller('EmergenciesDetailsController', EmergenciesDetailsCtrl)
    .filter('checkDate', function ($filter) {
        return function (input) {
            if (input == null) {
                return "";
            }
            moment.locale('de');
            if (moment(input).startOf('day').isSame(moment().startOf('day'))) {
                return "Heute vor " + moment(input).fromNow(true);
            } else {
                if (moment(input).startOf('day').isSame(moment().subtract(1, 'day').startOf('day'))) {
                    return "Gestern um " + moment(input).format("HH:mm:ss");
                } else {
                    return moment(input).format("DD.MM.YYYY HH:mm:ss");
                }
            }
        };
    })
    .filter('parseDate', function ($filter) {
        return function (input) {
            console.log(input);
            if (input == null) {
                return "";
            }
            moment.locale('de');
            return moment(input).format("DD.MM.YYYY HH:mm:ss");
        };
    });

function NavigationCtrl($scope, $location, $http, $timeout) {
    $scope.hasEmergency = false;
    $scope.data = [];
    $scope.isActive = function (viewLocation) {
        return ($location.path().indexOf(viewLocation) != -1);
    };

    $scope.remove = function (item) {
        var index = $scope.data.indexOf(item);
        $scope.data.splice(index, 1);
    };

    (function tick() {
        $http.get(URL + "/checkemergency").success(function (data) {
            if (data) {
                for (i = 0; i < data.length; i++) {
                    $scope.data.push(data[i]);
                }
                $scope.hasEmergency = true;
            }
            $timeout(tick, 2500);
        });
    })();
}

function PatientsCtrl($scope, $state, $stateParams, $http) {
    $scope.isActive = function (id) {
        return $stateParams.id == id;
    }
    $http.get(URL + "/patients").success(function (response) {
        $scope.patients = response;
    });
}

function PatientsDetailsCtrl($scope, $state, $stateParams, $http, $timeout) {
    $scope.drug = {};
    $scope.disease = {};

    $scope.resize = function () {
        $timeout(function () {
            $scope.$broadcast('highchartsng.reflow');
        }, 10);
    }

    $http.get(URL + "/patient/" + $stateParams.id + "/info").success(function (response) {
        $scope.patient = response[0];
    });
    $http.get(URL + "/patient/" + $stateParams.id + "/contact").success(function (response) {
        $scope.contact = response[0];
    });
    $http.get(URL + "/patient/" + $stateParams.id + "/drugs").success(function (response) {
        $scope.drugs = response;
    });
    $http.get(URL + "/patient/" + $stateParams.id + "/diseases").success(function (response) {
        $scope.diseases = response;
    });
    $http.get(URL + "/patient/" + $stateParams.id + "/activities").success(function (response) {
        $scope.chartConfig = {
            options: {
                chart: {
                    height: 600,
                    type: 'line',
                    zoomType: 'x'
                },
                xAxis: [{
                    type: 'datetime',
                    ordinal: true
                }],
                yAxis: [{
                    title: {
                        text: 'Aktivitäten der letzten 24 Stunden',
                        style: {
                            color: '#80A3CA'
                        }
                    },
                    labels: {
                        format: '{value}',
                        style: {
                            color: '#80A3CA'
                        }
                    }
                }],
                useHighStocks: true,
                credits: {
                    enabled: false
                }
            },
            series: [{
                data: response,
                name: "Distanz in m",
                color: '#FFA500'
            }],
            title: {
                text: 'Aktivitäten von ' + $scope.patient.firstname + " " + $scope.patient.lastname
            }
        }
    });

    $scope.addDrug = function () {
        $http.post(URL + "/patient/drug/add", {
            id: $stateParams.id,
            name: $scope.drug.name
        }).success(function (data) {
            $scope.drugs.push({
                'id': data.id,
                'name': $scope.drug.name
            });
            $scope.drug = "";
        });
    };
    $scope.deleteDrug = function (index) {
        $http.post(URL + "/patient/drug/remove", {
            id: $scope.drugs[index].id,
            name: $scope.drug.name
        }).success(function (data) {
            $scope.drugs.splice(index, 1);
        });
    };

    $scope.addDisease = function () {
        $http.post(URL + "/patient/disease/add", {
            id: $stateParams.id,
            name: $scope.disease.name
        }).success(function (data) {
            $scope.diseases.push({
                'id': data.id,
                'name': $scope.disease.name
            });
            $scope.disease = "";
        });
    }
    $scope.deleteDisease = function (index) {
        $http.post(URL + "/patient/disease/remove", {
            id: $scope.diseases[index].id
        }).success(function (data) {
            $scope.diseases.splice(index, 1);
        });
    };
}

function EmergenciesCtrl($scope, $state, $stateParams, $http) {
    $scope.isActive = function (id) {
        return $stateParams.id == id;
    }
    $http.get(URL + "/emergencies").success(function (response) {
        $scope.emergencies = response;
    });
}

function EmergenciesDetailsCtrl($scope, $state, $stateParams, $http, $filter) {
    $http.get(URL + "/emergencies/" + $stateParams.id + "/details").success(function (response) {
        $scope.emergency = response[0];
    });
    $scope.$watch('emergency.time', function (newValue) {
        if ($scope.emergency) {
            $scope.emergency.time = $filter('date')(newValue, 'dd.MM.yyyy HH:mm:ss');
        }

    });
}
