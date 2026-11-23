class Todo < ApplicationRecord
  belongs_to :user

  normalizes :description, with: ->(d) { d.strip }

  validates :description, presence: true, length: { maximum: 500 }
end
