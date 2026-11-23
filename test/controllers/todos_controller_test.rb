require "test_helper"

class TodosControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @todo = todos(:groceries)
    @done_todo = todos(:laundry)
    @other_todo = todos(:other_users_todo)
  end

  def sign_in(user = @user)
    post login_path, params: { email: user.email, password: "password" }
  end

  test "root shows the landing page when logged out" do
    get root_path
    assert_response :success
    assert_equal "Home", inertia_component
  end

  test "root shows only the current user's to-dos when logged in" do
    sign_in
    get root_path
    assert_response :success
    assert_equal "Todos", inertia_component

    descriptions = inertia_props["todos"].map { |t| t["description"] }
    assert_equal [ "Buy groceries", "Do laundry" ], descriptions.sort
    assert_not_includes descriptions, @other_todo.description
  end

  test "requires login for every action" do
    assert_no_difference -> { Todo.count } do
      post todos_path, params: { todo: { description: "Nope" } }
    end
    assert_redirected_to login_path

    patch todo_path(@todo), params: { todo: { completed: true } }
    assert_redirected_to login_path
    assert_not @todo.reload.completed

    assert_no_difference -> { Todo.count } do
      delete todo_path(@todo)
    end
    assert_redirected_to login_path
  end

  test "creates a to-do for the current user" do
    sign_in
    assert_difference -> { @user.todos.count }, 1 do
      post todos_path, params: { todo: { description: "Walk the dog" } }
    end
    assert_redirected_to root_path

    todo = @user.todos.order(:id).last
    assert_equal "Walk the dog", todo.description
    assert_not todo.completed
  end

  test "rejects a blank description" do
    sign_in
    assert_no_difference -> { Todo.count } do
      post todos_path, params: { todo: { description: "" } }
    end
    assert_response :redirect
  end

  test "marks a to-do complete and back to incomplete" do
    sign_in

    patch todo_path(@todo), params: { todo: { completed: true } }
    assert_redirected_to root_path
    assert @todo.reload.completed

    patch todo_path(@todo), params: { todo: { completed: false } }
    assert_redirected_to root_path
    assert_not @todo.reload.completed
  end

  test "can uncomplete an already completed to-do" do
    sign_in
    patch todo_path(@done_todo), params: { todo: { completed: false } }
    assert_not @done_todo.reload.completed
  end

  test "edits the description without changing completion" do
    sign_in
    patch todo_path(@done_todo), params: { todo: { description: "Fold laundry" } }
    assert_redirected_to root_path
    @done_todo.reload
    assert_equal "Fold laundry", @done_todo.description
    assert @done_todo.completed
  end

  test "rejects editing to a blank description" do
    sign_in
    patch todo_path(@todo), params: { todo: { description: "" } }
    assert_response :redirect
    assert_equal "Buy groceries", @todo.reload.description
  end

  test "deletes a to-do" do
    sign_in
    assert_difference -> { Todo.count }, -1 do
      delete todo_path(@todo)
    end
    assert_redirected_to root_path
  end

  test "cannot update another user's to-do" do
    sign_in
    patch todo_path(@other_todo), params: { todo: { completed: true } }
    assert_response :not_found
    assert_not @other_todo.reload.completed
  end

  test "cannot delete another user's to-do" do
    sign_in
    assert_no_difference -> { Todo.count } do
      delete todo_path(@other_todo)
    end
    assert_response :not_found
  end

  private
    def inertia_page
      if response.media_type == "text/html"
        JSON.parse(CGI.unescapeHTML(response.body[/data-page="([^"]*)"/, 1].to_s))
      else
        JSON.parse(response.body)
      end
    end

    def inertia_component = inertia_page["component"]
    def inertia_props = inertia_page["props"]
end
