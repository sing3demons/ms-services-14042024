
import { todoController } from './todo.bootstrap.js';
import { Router } from 'express';


export  class TodoRoute {
    public static Register(router: Router) {
    
        router.post('/', todoController.createTodo)

        return router
    }
}