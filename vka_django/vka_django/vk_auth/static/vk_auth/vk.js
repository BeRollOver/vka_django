VK.init({
    apiId: 5306414
});

VK.Auth.getLoginStatus(function (response) {
    if (response.session) {
        /* Авторизованный в Open API пользователь, response.status="connected" */
    } else {
        /* Неавторизованный в Open API пользователь,  response.status="not_authorized" */
        VK.Auth.login(function (response) {
            alert(response);
        }, 262152 + 8192);
    }
});
