require "test_helper"

class TodoTest < ActiveSupport::TestCase
  test "is valid with a description and a user" do
    assert users(:one).todos.new(description: "Write tests").valid?
  end

  test "defaults to incomplete" do
    assert_not users(:one).todos.create!(description: "Write tests").completed
  end

  test "requires a description" do
    todo = users(:one).todos.new(description: "   ")
    assert_not todo.valid?
    assert_includes todo.errors[:description], "can't be blank"
  end

  test "limits the description to 500 characters" do
    assert users(:one).todos.new(description: "a" * 500).valid?
    assert_not users(:one).todos.new(description: "a" * 501).valid?
  end

  test "strips whitespace from the description" do
    assert_equal "Trim me", users(:one).todos.create!(description: "  Trim me  ").description
  end

  test "is destroyed with its user" do
    assert_difference -> { Todo.count }, -users(:one).todos.count do
      users(:one).destroy
    end
  end
end
