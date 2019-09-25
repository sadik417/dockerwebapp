node {
    checkout scm

    docker.withRegistry('https://registry.hub.docker.com', 'sadik417demo') {

        def customImage = docker.build("sadik417/dockerwebapp")

        /* Push the container to the custom Registry */
        customImage.push()
    }
}