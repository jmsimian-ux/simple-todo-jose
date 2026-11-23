# frozen_string_literal: true

class PagesController < ApplicationController
  allow_unauthenticated_access only: :home

  def home
    return render inertia: "Home" unless authenticated?

    render inertia: "Todos", props: {
      todos: Current.user.todos.order(:created_at, :id).map do |todo|
        { id: todo.id, description: todo.description, completed: todo.completed }
      end
    }
  end
end
