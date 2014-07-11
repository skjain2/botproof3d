class Submission < ActiveRecord::Base
  attr_accessor :apis

  def initialize *args

    self.apis = %W(Thingiverse Ponoko Shapeways Github)
    super
  end

  belongs_to :user

  mount_uploader :image, ImageUploader
end
